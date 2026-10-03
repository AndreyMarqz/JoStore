package com.jostore.dev.dto.requests;

import java.util.List;

public record CreateOrderRequestDto(
        OrderQuoteRequestDto quote,
        List<CardPaymentRequestDto> cardPayments) { }
