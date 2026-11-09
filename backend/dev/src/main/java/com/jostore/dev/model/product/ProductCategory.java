package com.jostore.dev.model.product;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "categorias_produto")
@Getter
@NoArgsConstructor
public class ProductCategory {

    @Id
    @Column(name = "cat_id")
    private UUID id;

    @Column(name = "cat_nome", nullable = false, unique = true, length = 80)
    private String name;

    @Column(name = "cat_ativa", nullable = false)
    private boolean active;
}
