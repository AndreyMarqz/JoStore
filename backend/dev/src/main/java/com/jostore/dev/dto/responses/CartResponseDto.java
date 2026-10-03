package com.jostore.dev.dto.responses;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CartResponseDto(UUID id, List<CartItemResponseDto> items, BigDecimal subtotal) { }
