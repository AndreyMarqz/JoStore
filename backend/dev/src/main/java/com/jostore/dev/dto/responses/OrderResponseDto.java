package com.jostore.dev.dto.responses;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.jostore.dev.model.enums.OrderStatusEnum;

public record OrderResponseDto(
        UUID id, String code, OrderStatusEnum status, Instant createdAt,
        AddressResponseDto deliveryAddress, List<CartItemResponseDto> items,
        List<OrderPaymentResponseDto> payments, List<CouponResponseDto> coupons,
        BigDecimal subtotal, BigDecimal shipping, BigDecimal couponDiscount, BigDecimal total,
        CouponResponseDto generatedExchangeCoupon, List<java.util.Map<String,Object>> history) { }
