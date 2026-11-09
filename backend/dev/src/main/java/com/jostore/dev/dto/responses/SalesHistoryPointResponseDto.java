package com.jostore.dev.dto.responses;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record SalesHistoryPointResponseDto(String month, Map<UUID, BigDecimal> values) { }
