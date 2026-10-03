package com.jostore.dev.controller;

import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.jostore.dev.dto.responses.CouponResponseDto;
import com.jostore.dev.service.OrderService;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/coupons")
public class CouponController {
    private final OrderService orderService;
    public CouponController(OrderService orderService) { this.orderService = orderService; }
    @GetMapping public List<CouponResponseDto> list(@PathVariable UUID customerId) {
        return orderService.listAvailableCoupons(customerId);
    }
}
