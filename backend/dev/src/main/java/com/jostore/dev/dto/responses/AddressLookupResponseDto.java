package com.jostore.dev.dto.responses;

public record AddressLookupResponseDto(
        String zipCode,
        String street,
        String neighborhood,
        String city,
        String state,
        String country) {
}
