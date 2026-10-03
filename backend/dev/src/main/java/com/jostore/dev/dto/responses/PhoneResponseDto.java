package com.jostore.dev.dto.responses;

import com.jostore.dev.model.enums.PhoneTypeEnum;

public record PhoneResponseDto(
    PhoneTypeEnum type,
    String areaCode,
    String number
) {}
