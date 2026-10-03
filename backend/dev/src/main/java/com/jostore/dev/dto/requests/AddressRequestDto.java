package com.jostore.dev.dto.requests;

import java.util.Set;

import com.jostore.dev.model.enums.PurposeEnum;
import com.jostore.dev.model.enums.StateEnum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddressRequestDto(
    @NotBlank(message = "Informe um nome curto para o endereço.")
    @Size(max = 60, message = "O nome curto do endereço deve ter no máximo 60 caracteres.")
    String label,

    @NotEmpty(message = "Informe ao menos uma finalidade para o endereço.")
    Set<PurposeEnum> roles,

    @NotBlank(message = "O tipo de residência é obrigatório.")
    @Size(max = 60, message = "O tipo de residência deve ter no máximo 60 caracteres.")
    String residenceType,

    @NotBlank(message = "O tipo de logradouro é obrigatório.")
    @Size(max = 60, message = "O tipo de logradouro deve ter no máximo 60 caracteres.")
    String streetType,

    @NotBlank(message = "O logradouro é obrigatório.")
    @Size(max = 150, message = "O logradouro deve ter no máximo 150 caracteres.")
    String street,

    @NotBlank(message = "O número do endereço é obrigatório.")
    @Size(max = 20, message = "O número do endereço deve ter no máximo 20 caracteres.")
    String number,

    @NotBlank(message = "O bairro é obrigatório.")
    @Size(max = 100, message = "O bairro deve ter no máximo 100 caracteres.")
    String neighborhood,

    @NotBlank(message = "O CEP é obrigatório.")
    @Pattern(regexp = "\\d{8}", message = "O CEP deve conter exatamente oito dígitos.")
    String zipCode,

    @NotBlank(message = "A cidade é obrigatória.")
    @Size(max = 100, message = "A cidade deve ter no máximo 100 caracteres.")
    String city,

    @NotNull(message = "O estado é obrigatório.")
    StateEnum state,

    @NotBlank(message = "O país é obrigatório.")
    @Size(max = 60, message = "O país deve ter no máximo 60 caracteres.")
    String country,

    @Size(max = 100, message = "O complemento deve ter no máximo 100 caracteres.")
    String complement,

    @Size(max = 500, message = "A observação deve ter no máximo 500 caracteres.")
    String notes
) {}
