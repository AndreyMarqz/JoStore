package com.jostore.dev.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CustomerPasswordUpdateRequestDto(
    @NotBlank(message = "A senha atual é obrigatória.")
    String currentPassword,

    @NotBlank(message = "A nova senha é obrigatória.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$",
        message = "A senha deve ter ao menos 8 caracteres, letra maiúscula, minúscula e caractere especial."
    )
    String password,

    @NotBlank(message = "A confirmação de senha é obrigatória.")
    String confirmPassword
) {}
