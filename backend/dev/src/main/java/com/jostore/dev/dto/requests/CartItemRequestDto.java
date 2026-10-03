package com.jostore.dev.dto.requests;

import java.util.UUID;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CartItemRequestDto(
        @NotNull UUID productId,
        @NotBlank String size,
        @NotNull @Min(1) @Max(99) Integer quantity) { }
