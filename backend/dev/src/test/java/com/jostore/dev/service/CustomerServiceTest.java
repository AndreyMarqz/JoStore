package com.jostore.dev.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.jostore.dev.dto.requests.AddressRequestDto;
import com.jostore.dev.dto.requests.CustomerRegistrationRequestDto;
import com.jostore.dev.dto.requests.PhoneRequestDto;
import com.jostore.dev.exception.BusinessRuleException;
import com.jostore.dev.model.enums.GenderEnum;
import com.jostore.dev.model.enums.PhoneTypeEnum;
import com.jostore.dev.model.enums.PurposeEnum;
import com.jostore.dev.model.enums.StateEnum;
import com.jostore.dev.repository.AddressRepository;
import com.jostore.dev.repository.CreditCardRepository;
import com.jostore.dev.repository.CustomerRepository;
import com.jostore.dev.repository.PublicPlaceTypeRepository;
import com.jostore.dev.repository.ResidenceTypeRepository;

class CustomerServiceTest {

    @Test
    void shouldRejectRegistrationWithoutBillingAndDeliveryAddressPurposes() {
        CustomerRepository customerRepository = mock(CustomerRepository.class);
        when(customerRepository.findByCpf("12345678901")).thenReturn(Optional.empty());
        when(customerRepository.findByUserEmailIgnoreCase("ana@example.com")).thenReturn(Optional.empty());
        when(customerRepository.findTopByOrderByCodeDesc()).thenReturn(Optional.empty());

        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        when(passwordEncoder.encode("Senha@123")).thenReturn("$2a$10$hashDeTesteComSessentaCaracteres12345678901234567890123456");

        CustomerService service = new CustomerService(
                customerRepository,
                mock(AddressRepository.class),
                mock(CreditCardRepository.class),
                mock(ResidenceTypeRepository.class),
                mock(PublicPlaceTypeRepository.class),
                passwordEncoder, mock(com.jostore.dev.repository.OperationLogRepository.class));

        CustomerRegistrationRequestDto request = new CustomerRegistrationRequestDto(
                "Ana Cliente da Silva",
                "12345678901",
                GenderEnum.FEMININO,
                LocalDate.of(1999, 3, 15),
                new PhoneRequestDto(PhoneTypeEnum.CELULAR, "11", "999999999"),
                "ana@example.com",
                "Senha@123",
                "Senha@123",
                List.of(new AddressRequestDto(
                        "Casa",
                        Set.of(PurposeEnum.RESIDENCIA),
                        "Casa",
                        "Rua",
                        "das Flores",
                        "100",
                        "Centro",
                        "01001000",
                        "São Paulo",
                        StateEnum.SP,
                        "Brasil",
                        null,
                        null)));

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessage("O cliente deve possuir endereço residencial, de cobrança e de entrega.");
    }
}
