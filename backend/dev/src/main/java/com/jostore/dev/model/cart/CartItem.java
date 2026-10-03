package com.jostore.dev.model.cart;

import java.util.UUID;

import com.jostore.dev.model.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "itens_carrinho")
@Getter
@NoArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ica_id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ica_car_id", nullable = false)
    private ShoppingCart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ica_pro_id", nullable = false)
    private Product product;

    @Column(name = "ica_tamanho", nullable = false, length = 10)
    private String size;

    @Column(name = "ica_quantidade", nullable = false)
    private int quantity;

    public CartItem(Product product, String size, int quantity) {
        this.product = product;
        this.size = size;
        this.quantity = quantity;
    }

    public void setCart(ShoppingCart cart) { this.cart = cart; }
    public void changeQuantity(int quantity) { this.quantity = quantity; }
}
