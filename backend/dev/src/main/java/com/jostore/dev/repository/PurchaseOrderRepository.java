package com.jostore.dev.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jostore.dev.model.order.PurchaseOrder;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
    PurchaseOrder findTopByOrderByCodeDesc();
    @org.springframework.data.jpa.repository.Query("select o from PurchaseOrder o where (:customer is null or o.customer.id=:customer) and (:status is null or o.status=:status) and o.code like concat('%',:code,'%')")
    org.springframework.data.domain.Page<PurchaseOrder> search(
        @org.springframework.data.repository.query.Param("customer") UUID customer,
        @org.springframework.data.repository.query.Param("status") com.jostore.dev.model.enums.OrderStatusEnum status,
        @org.springframework.data.repository.query.Param("code") String code,org.springframework.data.domain.Pageable page);
}
