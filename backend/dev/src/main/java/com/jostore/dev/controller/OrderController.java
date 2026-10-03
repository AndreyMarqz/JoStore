package com.jostore.dev.controller;

import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import com.jostore.dev.dto.requests.CreateOrderRequestDto;
import com.jostore.dev.dto.requests.OrderQuoteRequestDto;
import com.jostore.dev.dto.responses.OrderQuoteResponseDto;
import com.jostore.dev.dto.responses.OrderResponseDto;
import com.jostore.dev.service.OrderService;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/orders")
public class OrderController {
    private final OrderService orderService;
    public OrderController(OrderService orderService) { this.orderService = orderService; }
    @PostMapping("/quote") public OrderQuoteResponseDto quote(@PathVariable UUID customerId, @Valid @RequestBody OrderQuoteRequestDto request) {
        return orderService.quote(customerId, request);
    }
    @PostMapping public ResponseEntity<OrderResponseDto> create(@PathVariable UUID customerId, @Valid @RequestBody CreateOrderRequestDto request) {
        OrderResponseDto order = orderService.createOrder(customerId, request);
        return ResponseEntity.created(URI.create("/api/v1/customers/" + customerId + "/orders/" + order.id())).body(order);
    }
}
