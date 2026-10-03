package com.jostore.dev.model.product;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "produtos")
@Getter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "pro_id")
    private UUID id;

    @Column(name = "pro_codigo", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "pro_nome", nullable = false, length = 160)
    private String name;

    @Column(name = "pro_descricao", nullable = false, length = 1000)
    private String description;

    @Column(name = "pro_preco", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "pro_imagem_url", length = 600)
    private String imageUrl;

    @Column(name = "pro_ativo", nullable = false)
    private boolean active;

    @OneToOne(mappedBy = "product")
    private Inventory inventory;
}
