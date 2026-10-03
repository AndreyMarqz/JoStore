package com.jostore.dev.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jostore.dev.model.order.PurchaseOrder;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
    PurchaseOrder findTopByOrderByCodeDesc();
}
