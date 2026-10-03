package com.jostore.dev.dto.responses;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderPaymentResponseDto(UUID cardId, String cardLabel, BigDecimal amount) { }
