package com.jostore.dev.model.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.jostore.dev.model.address.Address;
import com.jostore.dev.model.customer.Customer;
import com.jostore.dev.model.enums.OrderStatusEnum;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pedidos")
@Getter
@NoArgsConstructor
public class PurchaseOrder {
    @Id @GeneratedValue(strategy = GenerationType.UUID) @Column(name = "ped_id")
    private UUID id;
    @Column(name = "ped_codigo", nullable = false, unique = true, length = 20)
    private String code;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ped_cli_id", nullable = false)
    private Customer customer;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ped_end_id", nullable = false)
    private Address deliveryAddress;
    @Enumerated(EnumType.STRING) @Column(name = "ped_status", nullable = false, length = 30)
    private OrderStatusEnum status;
    @Column(name = "ped_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;
    @Column(name = "ped_frete", nullable = false, precision = 12, scale = 2)
    private BigDecimal shipping;
    @Column(name = "ped_desconto_cupons", nullable = false, precision = 12, scale = 2)
    private BigDecimal couponDiscount;
    @Column(name = "ped_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal total;
    @Column(name = "ped_created_at", nullable = false)
    private Instant createdAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ped_cup_gerado_id")
    private com.jostore.dev.model.coupon.Coupon generatedCoupon;

    public void transitionTo(OrderStatusEnum expected, OrderStatusEnum next) {
        if (status != expected) throw new com.jostore.dev.exception.BusinessRuleException(
            "Transição inválida: o pedido deve estar " + expected.name().replace('_', ' ') + ".");
        status = next;
    }
    public void recordGeneratedCoupon(com.jostore.dev.model.coupon.Coupon coupon) { generatedCoupon = coupon; }
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderPayment> payments = new ArrayList<>();
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderCoupon> coupons = new ArrayList<>();

    public PurchaseOrder(String code, Customer customer, Address deliveryAddress, BigDecimal subtotal, BigDecimal shipping, BigDecimal couponDiscount, BigDecimal total) {
        this.code = code;
        this.customer = customer;
        this.deliveryAddress = deliveryAddress;
        this.subtotal = subtotal;
        this.shipping = shipping;
        this.couponDiscount = couponDiscount;
        this.total = total;
        this.status = OrderStatusEnum.EM_PROCESSAMENTO;
        this.createdAt = Instant.now();
    }
    public void addItem(OrderItem item) { items.add(item); item.setOrder(this); }
    public void addPayment(OrderPayment payment) { payments.add(payment); payment.setOrder(this); }
    public void addCoupon(OrderCoupon coupon) { coupons.add(coupon); coupon.setOrder(this); }
}
