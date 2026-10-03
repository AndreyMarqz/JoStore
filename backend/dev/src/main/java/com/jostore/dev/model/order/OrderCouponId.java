package com.jostore.dev.model.order;

import java.io.Serializable;
import java.util.UUID;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode @NoArgsConstructor
public class OrderCouponId implements Serializable {
    private UUID order;
    private UUID coupon;
}
