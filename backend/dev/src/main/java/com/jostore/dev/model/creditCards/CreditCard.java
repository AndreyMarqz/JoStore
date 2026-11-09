package com.jostore.dev.model.creditCards;

import java.util.Objects;
import java.util.UUID;

import com.jostore.dev.model.customer.Customer;
import com.jostore.dev.model.enums.CardFlagEnum;

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
@Table(name = "cartoes_credito")
@Getter
@NoArgsConstructor
public class CreditCard {
    @Column(name = "cart_perfil", nullable = false)
    private boolean savedToProfile = true;
    public void useOnlyForCheckout() { savedToProfile = false; }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "cart_id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_cli_id", nullable = false)
    private Customer customer;

    @Column(name = "cart_last4", nullable = false, length = 4)
    private String last4;

    @Column(name = "cart_nome_impr", nullable = false, length = 150)
    private String cardName;

    @Enumerated(EnumType.STRING)
    @Column(name = "cart_band", nullable = false, length = 30)
    private CardFlagEnum cardFlag;

    @Column(name = "cart_pref", nullable = false)
    private boolean preferredCard;

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public void makePreferred() {
        this.preferredCard = true;
    }

    public void removePreference() {
        this.preferredCard = false;
    }

    public String getMaskedNumber() {
        return "**** **** **** " + last4;
    }

    public CreditCard(String cardNumber, String cardName, CardFlagEnum cardFlag) {
        updateData(cardNumber, cardName, cardFlag);
    }

    public void updateData(String cardNumber, String cardName, CardFlagEnum cardFlag) {
        String number = Objects.requireNonNull(cardNumber, "O número do cartão é obrigatório.")
            .replaceAll("\\D", "");

        if (number.length() < 4) {
            throw new IllegalArgumentException("O número do cartão deve conter pelo menos quatro dígitos.");
        }

        this.last4 = number.substring(number.length() - 4);
        this.cardName = Objects.requireNonNull(cardName, "O nome do titular do cartão é obrigatório.");
        this.cardFlag = Objects.requireNonNull(cardFlag, "A bandeira do cartão é obrigatória.");
    }
}
