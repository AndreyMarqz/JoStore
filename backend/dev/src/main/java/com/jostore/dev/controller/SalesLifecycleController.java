package com.jostore.dev.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import jakarta.validation.Valid;
import com.jostore.dev.service.SalesLifecycleService;
import com.jostore.dev.service.SalesLifecycleService.*;
import com.jostore.dev.dto.responses.OrderResponseDto;

@RestController
@RequestMapping("/api/v1")
public class SalesLifecycleController {
    private final SalesLifecycleService sales;
    public SalesLifecycleController(SalesLifecycleService sales) { this.sales=sales; }
    @GetMapping("/customers/{customerId}/orders")
    public Page<OrderResponseDto> customerOrders(@PathVariable UUID customerId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return sales.list(customerId,null,null,page,size); }
    @GetMapping("/customers/{customerId}/orders/{orderId}")
    public OrderResponseDto customerOrder(@PathVariable UUID customerId,@PathVariable UUID orderId) { return sales.get(orderId,customerId); }
    @GetMapping("/orders")
    public Page<OrderResponseDto> orders(@RequestParam(required=false) UUID customerId,@RequestParam(required=false) String status,@RequestParam(required=false) String code,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return sales.list(customerId,status,code,page,size); }
    @GetMapping("/orders/{id}") public OrderResponseDto order(@PathVariable UUID id) { return sales.get(id,null); }
    @PostMapping("/orders/{id}/dispatch") public OrderResponseDto dispatch(@PathVariable UUID id) { return sales.transition(id,true); }
    @PostMapping("/orders/{id}/delivery-confirmation") public OrderResponseDto delivered(@PathVariable UUID id) { return sales.transition(id,false); }
    @PostMapping("/customers/{customerId}/orders/{orderId}/exchanges")
    public Map<String,Object> requestExchange(@PathVariable UUID customerId,@PathVariable UUID orderId,@Valid @RequestBody ExchangeRequest request) { return sales.requestExchange(customerId,orderId,request); }
    @GetMapping("/customers/{customerId}/exchanges") public List<Map<String,Object>> customerExchanges(@PathVariable UUID customerId) { return sales.exchanges(customerId,null); }
    @GetMapping("/exchanges") public List<Map<String,Object>> exchanges(@RequestParam(required=false) String status) { return sales.exchanges(null,status); }
    @PostMapping("/exchanges/{id}/authorize") public Map<String,Object> authorize(@PathVariable UUID id) { return sales.authorize(id); }
    @PostMapping("/exchanges/{id}/receipt-confirmation") public Map<String,Object> receive(@PathVariable UUID id,@Valid @RequestBody ReceiptRequest request) { return sales.receive(id,request); }
    @GetMapping("/customers/{customerId}/notifications") public List<Map<String,Object>> notifications(@PathVariable UUID customerId) { return sales.notifications(customerId); }
    @PatchMapping("/customers/{customerId}/notifications/{id}/read") public void read(@PathVariable UUID customerId,@PathVariable UUID id) { sales.readNotification(customerId,id); }
}
