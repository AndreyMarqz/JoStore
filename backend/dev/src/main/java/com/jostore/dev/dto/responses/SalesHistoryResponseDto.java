package com.jostore.dev.dto.responses;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SalesHistoryResponseDto(
        LocalDate startDate,
        LocalDate endDate,
        List<ProductCategoryResponseDto> categories,
        List<SalesHistoryPointResponseDto> points,
        BigDecimal total) { }
