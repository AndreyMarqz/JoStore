package com.jostore.dev.model.product;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "estoques")
@Getter
@NoArgsConstructor
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "est_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "est_pro_id", nullable = false, unique = true)
    private Product product;

    @Column(name = "est_quantidade_disponivel", nullable = false)
    private int availableQuantity;
    public void decrease(int quantity) {
        if (quantity <= 0 || quantity > availableQuantity)
            throw new com.jostore.dev.exception.BusinessRuleException("Estoque insuficiente para aprovar o pedido.");
        availableQuantity -= quantity;
    }
    public void increase(int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantidade deve ser positiva.");
        availableQuantity += quantity;
    }
}
