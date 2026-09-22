package com.jostore.dev.service;

import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jostore.dev.dto.requests.AddressRequestDto;
import com.jostore.dev.dto.requests.CreditCardRequestDto;
import com.jostore.dev.dto.requests.CustomerPasswordUpdateRequestDto;
import com.jostore.dev.dto.requests.CustomerRegistrationRequestDto;
import com.jostore.dev.dto.requests.CustomerStatusUpdateRequestDto;
import com.jostore.dev.dto.requests.CustomerUpdateRequestDto;
import com.jostore.dev.dto.requests.PhoneRequestDto;
import com.jostore.dev.dto.responses.AddressResponseDto;
import com.jostore.dev.dto.responses.CreditCardResponseDto;
import com.jostore.dev.dto.responses.CustomerResponseDto;
import com.jostore.dev.dto.responses.CustomerSummaryResponseDto;
import com.jostore.dev.dto.responses.PhoneResponseDto;
import com.jostore.dev.exception.BusinessRuleException;
import com.jostore.dev.exception.ConflictException;
import com.jostore.dev.exception.ResourceNotFoundException;
import com.jostore.dev.model.address.Address;
import com.jostore.dev.model.address.PublicPlaceType;
import com.jostore.dev.model.address.ResidenceType;
import com.jostore.dev.model.creditCards.CreditCard;
import com.jostore.dev.model.customer.Customer;
import com.jostore.dev.model.enums.CustomerStatusEnum;
import com.jostore.dev.model.enums.PurposeEnum;
import com.jostore.dev.model.phones.Phone;
import com.jostore.dev.model.users.User;
import com.jostore.dev.repository.AddressRepository;
import com.jostore.dev.repository.CreditCardRepository;
import com.jostore.dev.repository.CustomerRepository;
import com.jostore.dev.repository.PublicPlaceTypeRepository;
import com.jostore.dev.repository.ResidenceTypeRepository;

import jakarta.persistence.criteria.JoinType;

@Service
public class CustomerService {

    private static final String PASSWORD_POLICY = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$";

    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final CreditCardRepository creditCardRepository;
    private final ResidenceTypeRepository residenceTypeRepository;
    private final PublicPlaceTypeRepository publicPlaceTypeRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(
            CustomerRepository customerRepository,
            AddressRepository addressRepository,
            CreditCardRepository creditCardRepository,
            ResidenceTypeRepository residenceTypeRepository,
            PublicPlaceTypeRepository publicPlaceTypeRepository,
            PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.addressRepository = addressRepository;
        this.creditCardRepository = creditCardRepository;
        this.residenceTypeRepository = residenceTypeRepository;
        this.publicPlaceTypeRepository = publicPlaceTypeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public CustomerResponseDto register(CustomerRegistrationRequestDto request) {
        validatePasswordConfirmation(request.password(), request.confirmPassword());
        validatePasswordPolicy(request.password());

        String cpf = normalizeDigits(request.cpf());
        String email = normalizeEmail(request.email());
        ensureCpfIsAvailable(cpf, null);
        ensureEmailIsAvailable(email, null);

        User user = new User(email, passwordEncoder.encode(request.password()));
        Customer customer = new Customer(
                request.fullName().trim(),
                cpf,
                request.gender(),
                request.birthDate(),
                user,
                nextCustomerCode());
        customer.addPhone(toPhone(request.phone()));
        validateInitialAddressPurposes(request.addresses());
        request.addresses().stream().map(this::toAddress).forEach(customer::addAddress);

        return toResponse(customerRepository.save(customer));
    }

    @Transactional(readOnly = true)
    public CustomerResponseDto getById(UUID customerId) {
        return toResponse(findCustomer(customerId));
    }

    @Transactional(readOnly = true)
    public Page<CustomerSummaryResponseDto> search(
            String code,
            String fullName,
            String cpf,
            String email,
            CustomerStatusEnum status,
            Pageable pageable) {
        Specification<Customer> specification = (root, query, builder) -> builder.conjunction();

        if (hasText(code)) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("code"), code.trim().toUpperCase(Locale.ROOT)));
        }
        if (hasText(fullName)) {
            String term = "%" + fullName.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("fullName")), term));
        }
        if (hasText(cpf)) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("cpf"), normalizeDigits(cpf)));
        }
        if (hasText(email)) {
            String normalizedEmail = normalizeEmail(email);
            specification = specification.and((root, query, builder) ->
                    builder.equal(builder.lower(root.join("user", JoinType.INNER).get("email")), normalizedEmail));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("status"), status));
        }

        return customerRepository.findAll(specification, pageable).map(this::toSummaryResponse);
    }

    @Transactional
    public CustomerResponseDto update(UUID customerId, CustomerUpdateRequestDto request) {
        Customer customer = findCustomer(customerId);
        String cpf = normalizeDigits(request.cpf());
        String email = normalizeEmail(request.email());

        ensureCpfIsAvailable(cpf, customerId);
        ensureEmailIsAvailable(email, customerId);

        customer.updatePersonalData(request.fullName().trim(), cpf, request.gender(), request.birthDate());
        customer.getUser().changeEmail(email);
        replacePrimaryPhone(customer, request.phone());

        return toResponse(customer);
    }

    @Transactional
    public void updatePassword(UUID customerId, CustomerPasswordUpdateRequestDto request) {
        Customer customer = findCustomer(customerId);

        if (!passwordEncoder.matches(request.currentPassword(), customer.getUser().getPasswordHash())) {
            throw new BusinessRuleException("A senha atual informada está incorreta.");
        }

        validatePasswordConfirmation(request.password(), request.confirmPassword());
        validatePasswordPolicy(request.password());
        customer.getUser().changePasswordHash(passwordEncoder.encode(request.password()));
    }

    @Transactional
    public CustomerResponseDto updateStatus(UUID customerId, CustomerStatusUpdateRequestDto request) {
        Customer customer = findCustomer(customerId);

        if (request.status() == null) {
            throw new BusinessRuleException("O status é obrigatório.");
        }

        if (request.status() == CustomerStatusEnum.ATIVO) {
            customer.reactivate();
        } else {
            customer.inactivate();
        }

        return toResponse(customer);
    }

    @Transactional
    public CustomerResponseDto addAddress(UUID customerId, AddressRequestDto request) {
        Customer customer = findCustomer(customerId);
        Address address = toAddress(request);
        customer.addAddress(address);
        addressRepository.save(address);

        return toResponse(customer);
    }

    @Transactional
    public CustomerResponseDto updateAddress(UUID customerId, UUID addressId, AddressRequestDto request) {
        Customer customer = findCustomer(customerId);
        Address address = findAddress(addressId, customerId);
        validateAddressPurposes(customer, address, request.roles());

        address.replacePurposes(request.roles());
        address.updateData(
                request.label().trim(),
                findResidenceType(request.residenceType()),
                findPublicPlaceType(request.streetType()),
                request.street().trim(),
                request.number().trim(),
                request.neighborhood().trim(),
                normalizeDigits(request.zipCode()),
                request.city().trim(),
                request.state(),
                request.country().trim(),
                normalizeOptional(request.notes()),
                normalizeOptional(request.complement()));

        return toResponse(customer);
    }

    @Transactional
    public void deleteAddress(UUID customerId, UUID addressId) {
        Customer customer = findCustomer(customerId);
        Address address = findAddress(addressId, customerId);
        validateAddressPurposes(customer, address, Set.of());
        customer.removeAddress(address);
    }

    @Transactional
    public CustomerResponseDto addCreditCard(UUID customerId, CreditCardRequestDto request) {
        Customer customer = findCustomer(customerId);
        validateCardNumber(request.number());
        CreditCard creditCard = new CreditCard(request.number(), request.holder().trim(), request.brand());

        if (customer.getCreditCards().isEmpty()) {
            creditCard.makePreferred();
        }

        customer.addCreditCard(creditCard);
        creditCardRepository.save(creditCard);
        return toResponse(customer);
    }

    @Transactional
    public CustomerResponseDto updateCreditCard(UUID customerId, UUID cardId, CreditCardRequestDto request) {
        Customer customer = findCustomer(customerId);
        validateCardNumber(request.number());
        findCreditCard(cardId, customerId).updateData(request.number(), request.holder().trim(), request.brand());
        return toResponse(customer);
    }

    @Transactional
    public void deleteCreditCard(UUID customerId, UUID cardId) {
        Customer customer = findCustomer(customerId);
        CreditCard creditCard = findCreditCard(cardId, customerId);
        customer.removeCreditCard(creditCard);
    }

    @Transactional
    public CustomerResponseDto setPreferredCreditCard(UUID customerId, UUID cardId) {
        Customer customer = findCustomer(customerId);
        customer.setPreferredCreditCard(findCreditCard(cardId, customerId));
        return toResponse(customer);
    }

    private Customer findCustomer(UUID customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado."));
    }

    private Address findAddress(UUID addressId, UUID customerId) {
        return addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Endereço não encontrado."));
    }

    private CreditCard findCreditCard(UUID cardId, UUID customerId) {
        return creditCardRepository.findByIdAndCustomerId(cardId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado."));
    }

    private Address toAddress(AddressRequestDto request) {
        return new Address(
                request.roles(),
                request.label().trim(),
                findResidenceType(request.residenceType()),
                findPublicPlaceType(request.streetType()),
                request.street().trim(),
                request.number().trim(),
                request.neighborhood().trim(),
                normalizeDigits(request.zipCode()),
                request.city().trim(),
                request.state(),
                request.country().trim(),
                normalizeOptional(request.notes()),
                normalizeOptional(request.complement()));
    }

    private ResidenceType findResidenceType(String description) {
        return residenceTypeRepository.findByDescriptionIgnoreCase(description.trim())
                .orElseThrow(() -> new BusinessRuleException("Tipo de residência não encontrado."));
    }

    private PublicPlaceType findPublicPlaceType(String description) {
        return publicPlaceTypeRepository.findByDescriptionIgnoreCase(description.trim())
                .orElseThrow(() -> new BusinessRuleException("Tipo de logradouro não encontrado."));
    }

    private Phone toPhone(PhoneRequestDto request) {
        return new Phone(request.type(), normalizeDigits(request.areaCode()), normalizeDigits(request.number()));
    }

    private void replacePrimaryPhone(Customer customer, PhoneRequestDto request) {
        Phone newPhone = toPhone(request);

        if (customer.getPhones().isEmpty()) {
            customer.addPhone(newPhone);
            return;
        }

        Phone primaryPhone = customer.getPhones().getFirst();
        primaryPhone.updateData(newPhone.getType(), newPhone.getDdd(), newPhone.getNumber());
        customer.getPhones().stream().skip(1).toList().forEach(customer::removePhone);
    }

    private void ensureCpfIsAvailable(String cpf, UUID currentCustomerId) {
        customerRepository.findByCpf(cpf)
                .filter(customer -> !customer.getId().equals(currentCustomerId))
                .ifPresent(customer -> {
                    throw new ConflictException("Já existe um cliente cadastrado com este CPF.");
                });
    }

    private void ensureEmailIsAvailable(String email, UUID currentCustomerId) {
        customerRepository.findByUserEmailIgnoreCase(email)
                .filter(customer -> !customer.getId().equals(currentCustomerId))
                .ifPresent(customer -> {
                    throw new ConflictException("Já existe um cliente cadastrado com este e-mail.");
                });
    }

    private String nextCustomerCode() {
        int nextNumber = customerRepository.findTopByOrderByCodeDesc()
                .map(Customer::getCode)
                .map(code -> Integer.parseInt(code.substring(4)) + 1)
                .orElse(1);

        return "CLI-%06d".formatted(nextNumber);
    }

    private void validatePasswordConfirmation(String password, String confirmPassword) {
        if (!password.equals(confirmPassword)) {
            throw new BusinessRuleException("Os campos de senha e confirmação devem ser iguais.");
        }
    }

    private void validatePasswordPolicy(String password) {
        if (!password.matches(PASSWORD_POLICY)) {
            throw new BusinessRuleException(
                    "A senha deve ter ao menos 8 caracteres, letra maiúscula, minúscula e caractere especial.");
        }
    }

    private void validateCardNumber(String cardNumber) {
        String digits = normalizeDigits(cardNumber);
        int sum = 0;
        boolean doubleDigit = false;

        for (int index = digits.length() - 1; index >= 0; index--) {
            int digit = digits.charAt(index) - '0';
            if (doubleDigit) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            doubleDigit = !doubleDigit;
        }

        if (digits.matches("(\\d)\\1+") || sum % 10 != 0) {
            throw new BusinessRuleException("Informe um número de cartão válido.");
        }
    }

    private void validateAddressPurposes(Customer customer, Address changedAddress, Set<PurposeEnum> newPurposes) {
        Set<PurposeEnum> currentPurposes = EnumSet.noneOf(PurposeEnum.class);
        customer.getAddresses().stream()
                .map(Address::getPurposes)
                .forEach(currentPurposes::addAll);

        Set<PurposeEnum> remainingPurposes = EnumSet.noneOf(PurposeEnum.class);

        customer.getAddresses().stream()
                .filter(address -> !address.getId().equals(changedAddress.getId()))
                .map(Address::getPurposes)
                .forEach(remainingPurposes::addAll);
        remainingPurposes.addAll(newPurposes);

        boolean currentlyMeetsRequiredPurposes = currentPurposes.containsAll(EnumSet.allOf(PurposeEnum.class));
        boolean wouldLoseRequiredPurposes = !remainingPurposes.containsAll(EnumSet.allOf(PurposeEnum.class));

        if (currentlyMeetsRequiredPurposes && wouldLoseRequiredPurposes) {
            throw new BusinessRuleException(
                    "O cliente deve manter endereço residencial, de cobrança e de entrega.");
        }
    }

    private void validateInitialAddressPurposes(List<AddressRequestDto> addresses) {
        Set<PurposeEnum> purposes = EnumSet.noneOf(PurposeEnum.class);
        addresses.stream().map(AddressRequestDto::roles).forEach(purposes::addAll);

        if (!purposes.containsAll(EnumSet.allOf(PurposeEnum.class))) {
            throw new BusinessRuleException(
                    "O cliente deve possuir endereço residencial, de cobrança e de entrega.");
        }
    }

    private CustomerResponseDto toResponse(Customer customer) {
        List<AddressResponseDto> addresses = customer.getAddresses().stream()
                .map(this::toAddressResponse)
                .toList();
        List<CreditCardResponseDto> cards = customer.getCreditCards().stream()
                .map(this::toCreditCardResponse)
                .toList();
        PhoneResponseDto phone = customer.getPhones().isEmpty() ? null : toPhoneResponse(customer.getPhones().getFirst());

        return new CustomerResponseDto(
                customer.getId(),
                customer.getCode(),
                customer.getFullName(),
                customer.getCpf(),
                customer.getGender(),
                customer.getBirthDate(),
                phone,
                customer.getUser().getEmail(),
                customer.getStatus(),
                addresses,
                cards);
    }

    private CustomerSummaryResponseDto toSummaryResponse(Customer customer) {
        return new CustomerSummaryResponseDto(
                customer.getId(),
                customer.getCode(),
                customer.getFullName(),
                customer.getCpf(),
                customer.getUser().getEmail(),
                customer.getStatus());
    }

    private AddressResponseDto toAddressResponse(Address address) {
        return new AddressResponseDto(
                address.getId(),
                address.getIdentification(),
                Set.copyOf(address.getPurposes()),
                address.getResidenceType().getDescription(),
                address.getPublicPlaceType().getDescription(),
                address.getPublicPlace(),
                address.getAddressNumber(),
                address.getNeighborhood(),
                address.getCep(),
                address.getCity(),
                address.getState(),
                address.getCountry(),
                address.getComplement(),
                address.getObservation());
    }

    private CreditCardResponseDto toCreditCardResponse(CreditCard creditCard) {
        return new CreditCardResponseDto(
                creditCard.getId(),
                creditCard.getCardName(),
                creditCard.getCardFlag(),
                creditCard.getLast4(),
                creditCard.isPreferredCard());
    }

    private PhoneResponseDto toPhoneResponse(Phone phone) {
        return new PhoneResponseDto(phone.getType(), phone.getDdd(), phone.getNumber());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeDigits(String value) {
        return value.replaceAll("\\D", "");
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
