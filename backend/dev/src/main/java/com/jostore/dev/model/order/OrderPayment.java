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
    @Column(name = "ppa_last4",nullable = false,length = 4) private String last4;
    @Column(name = "ppa_descricao",nullable = false,length = 100) private String description;
    public OrderPayment(CreditCard card, BigDecimal amount) {
        this.card = card; this.amount = amount; this.last4=card.getLast4();
        this.description=card.getCardFlag()+" final "+card.getLast4();
    }
    public void setOrder(PurchaseOrder order) { this.order = order; }
}
