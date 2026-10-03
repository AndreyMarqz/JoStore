package com.jostore.dev.dto.responses;

import java.util.UUID;

import com.jostore.dev.model.enums.CardFlagEnum;

public record CreditCardResponseDto(
    UUID id,
    String holder,
    CardFlagEnum brand,
    String last4,
    boolean preferred
) {}
