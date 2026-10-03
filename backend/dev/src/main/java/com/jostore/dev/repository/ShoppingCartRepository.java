package com.jostore.dev.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jostore.dev.model.cart.ShoppingCart;

public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, UUID> {
    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<ShoppingCart> findByCustomerId(UUID customerId);
}
