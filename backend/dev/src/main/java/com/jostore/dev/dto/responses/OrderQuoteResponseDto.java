package com.jostore.dev.dto.responses;

import java.math.BigDecimal;
import java.util.List;

public record OrderQuoteResponseDto(
        BigDecimal subtotal, BigDecimal shipping, BigDecimal couponDiscount,
        BigDecimal total, List<CouponResponseDto> appliedCoupons) { }
