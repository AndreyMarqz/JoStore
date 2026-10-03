package com.jostore.dev.model.order;

import java.math.BigDecimal;
import java.util.UUID;
import com.jostore.dev.model.product.Product;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity @Table(name = "itens_pedido") @Getter @NoArgsConstructor
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.UUID) @Column(name = "ipe_id") private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ipe_ped_id", nullable = false) private PurchaseOrder order;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ipe_pro_id", nullable = false) private Product product;
    @Column(name = "ipe_codigo_produto", nullable = false, length = 20) private String productCode;
    @Column(name = "ipe_nome_produto", nullable = false, length = 160) private String productName;
    @Column(name = "ipe_tamanho", nullable = false, length = 10) private String size;
    @Column(name = "ipe_preco_unitario", nullable = false, precision = 12, scale = 2) private BigDecimal unitPrice;
    @Column(name = "ipe_quantidade", nullable = false) private int quantity;
    @Column(name = "ipe_total", nullable = false, precision = 12, scale = 2) private BigDecimal total;
    public OrderItem(Product product, String size, int quantity) {
        this.product = product; this.productCode = product.getCode(); this.productName = product.getName(); this.size = size;
        this.unitPrice = product.getPrice(); this.quantity = quantity; this.total = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
    public void setOrder(PurchaseOrder order) { this.order = order; }
}
