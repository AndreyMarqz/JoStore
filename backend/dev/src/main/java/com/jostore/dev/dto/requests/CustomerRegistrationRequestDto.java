package com.jostore.dev.dto.requests;

import java.time.LocalDate;
import java.util.List;

import com.jostore.dev.model.enums.GenderEnum;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CustomerRegistrationRequestDto(
    @NotBlank(message = "O nome completo é obrigatório.")
    @Size(max = 150, message = "O nome completo deve ter no máximo 150 caracteres.")
    String fullName,

    @NotBlank(message = "O CPF é obrigatório.")
    @Pattern(regexp = "\\d{11}", message = "O CPF deve conter exatamente 11 dígitos numéricos.")
    String cpf,

    @NotNull(message = "O gênero é obrigatório.")
    GenderEnum gender,

    @NotNull(message = "A data de nascimento é obrigatória.")
    @Past(message = "A data de nascimento deve estar no passado.")
    LocalDate birthDate,

    @NotNull(message = "O telefone é obrigatório.")
    @Valid
    PhoneRequestDto phone,

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Informe um e-mail válido.")
    @Size(max = 254, message = "O e-mail deve ter no máximo 254 caracteres.")
    String email,

    @NotBlank(message = "A senha é obrigatória.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$",
        message = "A senha deve ter ao menos 8 caracteres, letra maiúscula, minúscula e caractere especial."
    )
    String password,

    @NotBlank(message = "A confirmação de senha é obrigatória.")
    String confirmPassword,

    @NotEmpty(message = "Cadastre ao menos um endereço para o cliente.")
    List<@Valid AddressRequestDto> addresses
) {}
