package com.jostore.dev.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jostore.dev.dto.requests.AddressRequestDto;
import com.jostore.dev.dto.responses.CustomerResponseDto;
import com.jostore.dev.service.CustomerService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/addresses")
public class AddressController {

    private final CustomerService customerService;

    public AddressController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public ResponseEntity<CustomerResponseDto> add(
            @PathVariable UUID customerId,
            @Valid @RequestBody AddressRequestDto request) {
        return ResponseEntity.status(201).body(customerService.addAddress(customerId, request));
    }

    @PutMapping("/{addressId}")
    public CustomerResponseDto update(
            @PathVariable UUID customerId,
            @PathVariable UUID addressId,
            @Valid @RequestBody AddressRequestDto request) {
        return customerService.updateAddress(customerId, addressId, request);
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> delete(@PathVariable UUID customerId, @PathVariable UUID addressId) {
        customerService.deleteAddress(customerId, addressId);
        return ResponseEntity.noContent().build();
    }
}
