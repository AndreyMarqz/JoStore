package com.jostore.dev.dto.responses;

import java.util.Set;
import java.util.UUID;

import com.jostore.dev.model.enums.PurposeEnum;
import com.jostore.dev.model.enums.StateEnum;

public record AddressResponseDto(
    UUID id,
    String label,
    Set<PurposeEnum> roles,
    String residenceType,
    String streetType,
    String street,
    String number,
    String neighborhood,
    String zipCode,
    String city,
    StateEnum state,
    String country,
    String complement,
    String notes
) {

}
