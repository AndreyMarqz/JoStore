package com.jostore.dev.controller;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import com.jostore.dev.dto.requests.CartItemRequestDto;
import com.jostore.dev.dto.responses.CartResponseDto;
import com.jostore.dev.service.OrderService;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/cart")
public class CartController {
    private final OrderService orderService;
    public CartController(OrderService orderService) { this.orderService = orderService; }
    @GetMapping public CartResponseDto get(@PathVariable UUID customerId) { return orderService.getCart(customerId); }
    @PostMapping("/items") public ResponseEntity<CartResponseDto> add(@PathVariable UUID customerId, @Valid @RequestBody CartItemRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.addItem(customerId, request));
    }
    @PutMapping("/items/{itemId}") public CartResponseDto update(@PathVariable UUID customerId, @PathVariable UUID itemId, @Valid @RequestBody CartItemRequestDto request) {
        return orderService.changeItemQuantity(customerId, itemId, request);
    }
    @DeleteMapping("/items/{itemId}") public ResponseEntity<Void> remove(@PathVariable UUID customerId, @PathVariable UUID itemId) {
        orderService.removeItem(customerId, itemId); return ResponseEntity.noContent().build();
    }
}
