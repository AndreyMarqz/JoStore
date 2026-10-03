package com.jostore.dev.dto.responses;

import java.time.OffsetDateTime;
import java.util.List;

public record ApiErrorDto(
        OffsetDateTime timestamp,
        int status,
        String code,
        String message,
        List<ApiFieldErrorDto> fieldErrors) {}
