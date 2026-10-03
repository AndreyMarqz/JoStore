package com.jostore.dev.controller;

import java.net.URI;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jostore.dev.dto.requests.CustomerPasswordUpdateRequestDto;
import com.jostore.dev.dto.requests.CustomerRegistrationRequestDto;
import com.jostore.dev.dto.requests.CustomerStatusUpdateRequestDto;
import com.jostore.dev.dto.requests.CustomerUpdateRequestDto;
import com.jostore.dev.dto.responses.CustomerResponseDto;
import com.jostore.dev.dto.responses.CustomerSummaryResponseDto;
import com.jostore.dev.model.enums.CustomerStatusEnum;
import com.jostore.dev.service.CustomerService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@Validated
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public ResponseEntity<CustomerResponseDto> register(
            @Valid @RequestBody CustomerRegistrationRequestDto request) {
        CustomerResponseDto customer = customerService.register(request);
        URI location = URI.create("/api/v1/customers/" + customer.id());

        return ResponseEntity.created(location).body(customer);
    }

    @GetMapping
    public Page<CustomerSummaryResponseDto> list(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String cpf,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) CustomerStatusEnum status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return customerService.search(code, fullName, cpf, email, status, PageRequest.of(page, size));
    }

    @GetMapping("/{customerId}")
    public CustomerResponseDto getById(@PathVariable UUID customerId) {
        return customerService.getById(customerId);
    }

    @PutMapping("/{customerId}")
    public CustomerResponseDto update(
            @PathVariable UUID customerId,
            @Valid @RequestBody CustomerUpdateRequestDto request) {
        return customerService.update(customerId, request);
    }

    @PatchMapping("/{customerId}/password")
    public ResponseEntity<Void> updatePassword(
            @PathVariable UUID customerId,
            @Valid @RequestBody CustomerPasswordUpdateRequestDto request) {
        customerService.updatePassword(customerId, request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PatchMapping("/{customerId}/status")
    public CustomerResponseDto updateStatus(
            @PathVariable UUID customerId,
            @Valid @RequestBody CustomerStatusUpdateRequestDto request) {
        return customerService.updateStatus(customerId, request);
    }
}
