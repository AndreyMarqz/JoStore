package com.jostore.dev.dto.responses;

import java.util.UUID;

import com.jostore.dev.model.enums.CustomerStatusEnum;

public record CustomerSummaryResponseDto(
    UUID id,
    String code,
    String fullName,
    String cpf,
    String email,
    CustomerStatusEnum status
) {}
