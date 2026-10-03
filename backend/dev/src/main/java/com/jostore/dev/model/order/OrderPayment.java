package com.jostore.dev.model.order;

import java.math.BigDecimal;
import java.util.UUID;
import com.jostore.dev.model.creditCards.CreditCard;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity @Table(name = "pagamentos_pedido") @Getter @NoArgsConstructor
public class OrderPayment {
    @Id @GeneratedValue(strategy = GenerationType.UUID) @Column(name = "ppa_id") private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ppa_ped_id", nullable = false) private PurchaseOrder order;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ppa_cart_id", nullable = false) private CreditCard card;
    @Column(name = "ppa_valor", nullable = false, precision = 12, scale = 2) private BigDecimal amount;
    public OrderPayment(CreditCard card, BigDecimal amount) { this.card = card; this.amount = amount; }
    public void setOrder(PurchaseOrder order) { this.order = order; }
}
