package com.jostore.dev.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jostore.dev.model.product.Product;

public interface ProductRepository extends JpaRepository<Product, UUID> { }
