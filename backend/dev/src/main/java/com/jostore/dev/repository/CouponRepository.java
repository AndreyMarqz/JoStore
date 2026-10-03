package com.jostore.dev.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.jostore.dev.model.coupon.Coupon;

public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    List<Coupon> findByIdInAndActiveTrue(Collection<UUID> ids);
    List<Coupon> findByActiveTrue();
    @Query("select c from Coupon c where c.active = true and (c.customer is null or c.customer.id = :customerId)")
    List<Coupon> findAvailableForCustomer(@Param("customerId") UUID customerId);
}
