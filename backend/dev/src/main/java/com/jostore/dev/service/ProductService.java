package com.jostore.dev.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.jostore.dev.dto.responses.ProductResponseDto;
import com.jostore.dev.model.product.Product;
import com.jostore.dev.repository.InventoryRepository;
import com.jostore.dev.repository.ProductRepository;

@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public ProductService(ProductRepository productRepository, InventoryRepository inventoryRepository) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDto> listAvailable() {
        return productRepository.findAll().stream()
                .filter(Product::isActive)
                .map(this::toResponse)
                .toList();
    }

    ProductResponseDto toResponse(Product product) {
        int availableQuantity = inventoryRepository.findByProductId(product.getId())
                .map(inventory -> inventory.getAvailableQuantity())
                .orElse(0);
        return new ProductResponseDto(product.getId(), product.getCode(), product.getName(),
                product.getDescription(), product.getPrice(), product.getImageUrl(), availableQuantity,
                product.getCategory().getId(), product.getCategory().getName());
    }
}
