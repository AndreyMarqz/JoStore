package com.jostore.dev.dto.responses;

import java.math.BigDecimal;
import java.util.UUID;
import com.jostore.dev.model.enums.CouponTypeEnum;

public record CouponResponseDto(UUID id, String code, CouponTypeEnum type, BigDecimal value, String description) { }
