package com.jostore.dev.controller;

import java.util.UUID;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import com.jostore.dev.service.CustomerService;
import com.jostore.dev.dto.requests.*;
import com.jostore.dev.dto.responses.*;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/checkout")
public class CheckoutDetailsController {
    private final CustomerService customers;
    public CheckoutDetailsController(CustomerService customers) { this.customers=customers; }
    @PostMapping("/addresses")
    public AddressResponseDto address(@PathVariable UUID customerId,@Valid @RequestBody AddressRequestDto body,@RequestParam(defaultValue="true") boolean saveToProfile) {
        return customers.createCheckoutAddress(customerId,body,saveToProfile);
    }
    @PostMapping("/cards")
    public CreditCardResponseDto card(@PathVariable UUID customerId,@Valid @RequestBody CreditCardRequestDto body,@RequestParam(defaultValue="true") boolean saveToProfile) {
        return customers.createCheckoutCard(customerId,body,saveToProfile);
    }
}
