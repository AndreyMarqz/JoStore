package com.jostore.dev.dto.requests;

import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotNull;

public record OrderQuoteRequestDto(
        @NotNull UUID deliveryAddressId,
        List<UUID> couponIds) { }
