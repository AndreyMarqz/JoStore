package com.jostore.dev.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jostore.dev.model.product.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, UUID> {
    Optional<Inventory> findByProductId(UUID productId);
}
