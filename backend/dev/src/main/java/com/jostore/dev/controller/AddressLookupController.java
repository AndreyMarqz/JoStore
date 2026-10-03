package com.jostore.dev.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jostore.dev.dto.responses.AddressLookupResponseDto;
import com.jostore.dev.service.AddressLookupService;

@RestController
@RequestMapping("/api/v1/addresses")
public class AddressLookupController {

    private final AddressLookupService addressLookupService;

    public AddressLookupController(AddressLookupService addressLookupService) {
        this.addressLookupService = addressLookupService;
    }

    @GetMapping("/lookup/{zipCode}")
    public AddressLookupResponseDto lookup(@PathVariable String zipCode) {
        return addressLookupService.lookup(zipCode);
    }
}
