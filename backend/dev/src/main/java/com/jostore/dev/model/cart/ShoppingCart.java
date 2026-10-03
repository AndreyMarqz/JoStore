package com.jostore.dev.model.cart;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.jostore.dev.model.customer.Customer;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import jakarta.persistence.EntityListeners;

@Entity
@Table(name = "carrinhos")
@Getter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class ShoppingCart {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "car_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_cli_id", nullable = false, unique = true)
    private Customer customer;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();

    @CreatedDate
    @Column(name = "car_created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "car_updated_at", nullable = false)
    private Instant updatedAt;

    public ShoppingCart(Customer customer) { this.customer = customer; }

    public void addItem(CartItem item) { items.add(item); item.setCart(this); }
    public void removeItem(CartItem item) { items.remove(item); item.setCart(null); }
}
