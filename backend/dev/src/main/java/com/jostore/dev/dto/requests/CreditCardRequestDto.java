package com.jostore.dev.dto.requests;

import com.jostore.dev.model.enums.CardFlagEnum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreditCardRequestDto(
    @NotBlank(message = "O nome do titular do cartão é obrigatório.")
    @Size(max = 150, message = "O nome do titular deve ter no máximo 150 caracteres.")
    String holder,

    @NotBlank(message = "O número do cartão é obrigatório.")
    @Pattern(regexp = "\\d{13,19}", message = "O número do cartão deve conter entre 13 e 19 dígitos.")
    String number,

    @NotNull(message = "A bandeira do cartão é obrigatória.")
    CardFlagEnum brand,

    @NotBlank(message = "O código de segurança é obrigatório.")
    @Pattern(regexp = "\\d{3,4}", message = "O código de segurança deve conter três ou quatro dígitos.")
    String securityCode
) {}
