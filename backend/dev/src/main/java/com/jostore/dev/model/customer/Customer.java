package com.jostore.dev.model.customer;

import com.jostore.dev.model.address.Address;
import com.jostore.dev.model.creditCards.CreditCard;
import com.jostore.dev.model.enums.CustomerStatusEnum;
import com.jostore.dev.model.enums.GenderEnum;
import com.jostore.dev.model.phones.Phone;
import com.jostore.dev.model.users.User;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "clientes")
@Getter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "cli_id")
    private UUID id;

    @Column(name = "cli_code", nullable = false, unique = true, length = 10)
    private String code;

    @Column(name = "cli_nome", nullable = false, length = 150)
    private String fullName;

    @Column(name = "cli_cpf", nullable = false, unique = true, length = 11)
    private String cpf;

    @Enumerated(EnumType.STRING)
    @Column(name = "cli_gen", nullable = false, length = 30)
    private GenderEnum gender;

    @Column(name = "cli_dta_nasc", nullable = false)
    private LocalDate birthDate;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Address> addresses = new ArrayList<>();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CreditCard> creditCards = new ArrayList<>();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Phone> phones = new ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true, optional = false)
    @JoinColumn(name = "cli_login", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "cli_status", nullable = false, length = 10)
    private CustomerStatusEnum status = CustomerStatusEnum.ATIVO;

    @CreatedDate
    @Column(name = "cli_created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "cli_updated_at", nullable = false)
    private Instant updatedAt;

    public void addAddress(Address address) {
        if (address != null) {
            this.addresses.add(address);
            address.setCustomer(this);
        }
    }

    public void removeAddress(Address address) {
        if (address != null) {
            this.addresses.remove(address);
            address.setCustomer(null);
        }
    }

    public void addPhone(Phone phone) {
        if (phone != null) {
            this.phones.add(phone);
            phone.setCustomer(this);
        }
    }

    public void removePhone(Phone phone) {
        if (phone != null) {
            this.phones.remove(phone);
            phone.setCustomer(null);
        }
    }

    public void addCreditCard(CreditCard creditCard) {
        if (creditCard != null) {
            this.creditCards.add(creditCard);
            creditCard.setCustomer(this);
        }
    }

    public void removeCreditCard(CreditCard creditCard) {
        if (creditCard != null) {
            this.creditCards.remove(creditCard);
            creditCard.setCustomer(null);
        }
    }

    public void setPreferredCreditCard(CreditCard creditCard) {
        if (creditCard == null || !this.creditCards.contains(creditCard)) {
            throw new IllegalArgumentException("O cartão não pertence ao cliente.");
        }

        this.creditCards.forEach(CreditCard::removePreference);
        creditCard.makePreferred();
    }

    public void updatePersonalData(String fullName, String cpf, GenderEnum gender, LocalDate birthDate) {
        this.fullName = Objects.requireNonNull(fullName, "O nome completo é obrigatório.");
        this.cpf = Objects.requireNonNull(cpf, "O CPF não pode ser nulo.");
        this.gender = Objects.requireNonNull(gender, "O gênero é obrigatório.");
        this.birthDate = Objects.requireNonNull(birthDate, "A data de nascimento é obrigatória.");
    }

    public void inactivate() {
        this.status = CustomerStatusEnum.INATIVO;
    }

    public void reactivate() {
        this.status = CustomerStatusEnum.ATIVO;
    }

    public Customer(String fullName, String cpf, GenderEnum gender, LocalDate birthDate, User user, String code) {
        this.fullName = Objects.requireNonNull(fullName, "O nome completo é obrigatório.");
        this.cpf = Objects.requireNonNull(cpf, "O CPF não pode ser nulo.");
        this.gender = Objects.requireNonNull(gender, "O gênero é obrigatório.");
        this.birthDate = Objects.requireNonNull(birthDate, "A data de nascimento é obrigatória.");
        this.user = Objects.requireNonNull(user, "As credenciais do usuário são obrigatórias.");
        this.code = Objects.requireNonNull(code, "O código do cliente é obrigatório.");

        this.status = CustomerStatusEnum.ATIVO;
    }
}
