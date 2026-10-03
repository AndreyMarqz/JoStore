package com.jostore.dev.model.phones;

import java.util.Objects;
import java.util.UUID;

import com.jostore.dev.model.customer.Customer;
import com.jostore.dev.model.enums.PhoneTypeEnum;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "telefones")
@Getter
@NoArgsConstructor
public class Phone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "tel_id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tel_cli_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "tel_tipo", nullable = false)
    private PhoneTypeEnum type;

    @Column(name = "tel_ddd", nullable = false, length = 2)
    private String ddd;

    @Column(name = "tel_num", nullable = false, length = 9)
    private String number;

    public Phone(PhoneTypeEnum type, String ddd, String number) {
        updateData(type, ddd, number);
    }

    public void updateData(PhoneTypeEnum type, String ddd, String number) {
        this.type = Objects.requireNonNull(type, "O tipo de telefone é obrigatório.");
        this.ddd = Objects.requireNonNull(ddd, "O DDD é obrigatório.");
        this.number = Objects.requireNonNull(number, "O número de telefone é obrigatório.");
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }
}
