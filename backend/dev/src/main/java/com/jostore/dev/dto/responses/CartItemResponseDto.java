package com.jostore.dev.dto.responses;

import java.math.BigDecimal;
import java.util.UUID;

public record CartItemResponseDto(
        UUID id, ProductResponseDto product, String size, int quantity,
        BigDecimal unitPrice, BigDecimal total) { }
