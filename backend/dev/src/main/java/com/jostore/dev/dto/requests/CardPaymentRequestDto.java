package com.jostore.dev.dto.requests;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record CardPaymentRequestDto(
        @NotNull UUID cardId,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount) { }
