package com.jostore.dev.dto.responses;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.jostore.dev.model.enums.CustomerStatusEnum;
import com.jostore.dev.model.enums.GenderEnum;

public record CustomerResponseDto(
    UUID id,
    String code,
    String fullName,
    String cpf,
    GenderEnum gender,
    LocalDate birthDate,
    PhoneResponseDto phone,
    String email,
    CustomerStatusEnum status,
    List<AddressResponseDto> addresses,
    List<CreditCardResponseDto> cards
) {}
