package com.jostore.dev.dto.requests;

import com.jostore.dev.model.enums.PhoneTypeEnum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record PhoneRequestDto(
    @NotNull(message = "O tipo de telefone é obrigatório.")
    PhoneTypeEnum type,

    @NotBlank(message = "O DDD é obrigatório.")
    @Pattern(regexp = "\\d{2}", message = "O DDD deve conter exatamente dois dígitos.")
    String areaCode,

    @NotBlank(message = "O número de telefone é obrigatório.")
    @Pattern(regexp = "\\d{8,9}", message = "O número de telefone deve conter oito ou nove dígitos.")
    String number
) {}
