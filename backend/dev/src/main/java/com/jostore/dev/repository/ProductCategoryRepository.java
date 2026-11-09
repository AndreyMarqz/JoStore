package com.jostore.dev.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jostore.dev.model.product.ProductCategory;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {
    List<ProductCategory> findByActiveTrueOrderByNameAsc();
    List<ProductCategory> findByIdInAndActiveTrue(Collection<UUID> ids);
}
