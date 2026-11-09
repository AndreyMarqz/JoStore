package com.jostore.dev.dto.responses;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponseDto(
        UUID id, String code, String name, String description, BigDecimal price,
        String imageUrl, int availableQuantity, UUID categoryId, String categoryName) { }
