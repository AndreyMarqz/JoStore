package com.jostore.dev.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jostore.dev.dto.requests.CreditCardRequestDto;
import com.jostore.dev.dto.responses.CustomerResponseDto;
import com.jostore.dev.service.CustomerService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/cards")
public class CreditCardController {

    private final CustomerService customerService;

    public CreditCardController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public ResponseEntity<CustomerResponseDto> add(
            @PathVariable UUID customerId,
            @Valid @RequestBody CreditCardRequestDto request) {
        return ResponseEntity.status(201).body(customerService.addCreditCard(customerId, request));
    }

    @PutMapping("/{cardId}")
    public CustomerResponseDto update(
            @PathVariable UUID customerId,
            @PathVariable UUID cardId,
            @Valid @RequestBody CreditCardRequestDto request) {
        return customerService.updateCreditCard(customerId, cardId, request);
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<Void> delete(@PathVariable UUID customerId, @PathVariable UUID cardId) {
        customerService.deleteCreditCard(customerId, cardId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{cardId}/preferred")
    public CustomerResponseDto setPreferred(@PathVariable UUID customerId, @PathVariable UUID cardId) {
        return customerService.setPreferredCreditCard(customerId, cardId);
    }
}
