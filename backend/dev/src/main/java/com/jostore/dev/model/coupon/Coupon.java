package com.jostore.dev.model.coupon;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.jostore.dev.model.enums.CouponTypeEnum;
import com.jostore.dev.model.customer.Customer;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cupons")
@Getter
@NoArgsConstructor
public class Coupon {
    @Id @GeneratedValue(strategy = GenerationType.UUID) @Column(name = "cup_id")
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "cup_cli_id")
    private Customer customer;
    @Column(name = "cup_codigo", nullable = false, unique = true, length = 40)
    private String code;
    @Enumerated(EnumType.STRING) @Column(name = "cup_tipo", nullable = false, length = 20)
    private CouponTypeEnum type;
    @Column(name = "cup_valor", nullable = false, precision = 12, scale = 2)
    private BigDecimal value;
    @Column(name = "cup_ativo", nullable = false)
    private boolean active;
    @Column(name = "cup_descricao", nullable = false, length = 300)
    private String description;
    @Column(name = "cup_criado_at", nullable = false)
    private Instant createdAt;
    @Column(name = "cup_usado_at")
    private Instant usedAt;

    public Coupon(String code, CouponTypeEnum type, BigDecimal value, String description) {
        this(code, type, value, description, null);
    }

    public Coupon(String code, CouponTypeEnum type, BigDecimal value, String description, Customer customer) {
        this.code = code;
        this.type = type;
        this.value = value;
        this.description = description;
        this.customer = customer;
        this.active = true;
        this.createdAt = Instant.now();
    }

    public void use() { this.active = false; this.usedAt = Instant.now(); }
}
