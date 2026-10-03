package com.jostore.dev.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.jostore.dev.dto.responses.AddressLookupResponseDto;

@Service
public class AddressLookupService {

    private final RestClient restClient;

    public AddressLookupService() {
        this.restClient = RestClient.create("https://viacep.com.br");
    }

    public AddressLookupResponseDto lookup(String zipCode) {
        String digits = zipCode == null ? "" : zipCode.replaceAll("\\D", "");
        if (!digits.matches("\\d{8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O CEP deve conter oito dígitos.");
        }

        ViaCepResponse response;
        try {
            response = restClient.get()
                    .uri("/ws/{zipCode}/json/", digits)
                    .retrieve()
                    .body(ViaCepResponse.class);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Não foi possível consultar o CEP no momento.", exception);
        }

        if (response == null || Boolean.TRUE.equals(response.erro())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CEP não encontrado.");
        }

        return new AddressLookupResponseDto(
                digits,
                nullToEmpty(response.logradouro()),
                nullToEmpty(response.bairro()),
                nullToEmpty(response.localidade()),
                nullToEmpty(response.uf()),
                "Brasil");
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private record ViaCepResponse(String logradouro, String bairro, String localidade, String uf, Boolean erro) {
    }
}
