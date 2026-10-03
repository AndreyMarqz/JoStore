package com.jostore.dev.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jostore.dev.model.cart.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    Optional<CartItem> findByIdAndCartCustomerId(UUID id, UUID customerId);
    Optional<CartItem> findByCartIdAndProductIdAndSize(UUID cartId, UUID productId, String size);
}
