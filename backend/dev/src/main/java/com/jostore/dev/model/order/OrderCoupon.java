package com.jostore.dev.model.order;

import java.math.BigDecimal;
import java.util.UUID;
import com.jostore.dev.model.coupon.Coupon;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity @Table(name = "pedidos_cupons") @Getter @NoArgsConstructor
@IdClass(OrderCouponId.class)
public class OrderCoupon {
    @Id @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "pcu_ped_id", nullable = false) private PurchaseOrder order;
    @Id @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "pcu_cup_id", nullable = false) private Coupon coupon;
    @Column(name = "pcu_valor_utilizado", nullable = false, precision = 12, scale = 2) private BigDecimal amountUsed;
    public OrderCoupon(Coupon coupon, BigDecimal amountUsed) { this.coupon = coupon; this.amountUsed = amountUsed; }
    public void setOrder(PurchaseOrder order) { this.order = order; }
}
