package com.jostore.dev.dto.requests;

import com.jostore.dev.model.enums.CustomerStatusEnum;

import jakarta.validation.constraints.NotNull;

public record CustomerStatusUpdateRequestDto(
    @NotNull(message = "O status é obrigatório.")
    CustomerStatusEnum status
) {}
