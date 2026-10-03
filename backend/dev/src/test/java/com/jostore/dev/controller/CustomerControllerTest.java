package com.jostore.dev.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.jostore.dev.dto.responses.CustomerResponseDto;
import com.jostore.dev.exception.ApiExceptionHandler;
import com.jostore.dev.model.enums.CustomerStatusEnum;
import com.jostore.dev.model.enums.GenderEnum;
import com.jostore.dev.model.enums.PhoneTypeEnum;
import com.jostore.dev.dto.responses.PhoneResponseDto;
import com.jostore.dev.service.CustomerService;

class CustomerControllerTest {

    private MockMvc mockMvc;
    private CustomerService customerService;

    @BeforeEach
    void setUp() {
        customerService = org.mockito.Mockito.mock(CustomerService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new CustomerController(customerService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void shouldRegisterCustomerWithRequiredAddressPurposes() throws Exception {
        UUID customerId = UUID.randomUUID();
        CustomerResponseDto response = new CustomerResponseDto(
                customerId,
                "CLI-000001",
                "Ana Cliente da Silva",
                "12345678901",
                GenderEnum.FEMININO,
                LocalDate.of(1999, 3, 15),
                new PhoneResponseDto(PhoneTypeEnum.CELULAR, "11", "999999999"),
                "ana@example.com",
                CustomerStatusEnum.ATIVO,
                List.of(),
                List.of());
        given(customerService.register(any())).willReturn(response);

        mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRegistrationJson()))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/customers/" + customerId))
                .andExpect(jsonPath("$.code").value("CLI-000001"))
                .andExpect(jsonPath("$.status").value("ATIVO"));
    }

    private String validRegistrationJson() {
        return """
                {
                  "fullName": "Ana Cliente da Silva",
                  "cpf": "12345678901",
                  "gender": "FEMININO",
                  "birthDate": "1999-03-15",
                  "phone": { "type": "CELULAR", "areaCode": "11", "number": "999999999" },
                  "email": "ana@example.com",
                  "password": "Senha@123",
                  "confirmPassword": "Senha@123",
                  "addresses": [{
                    "label": "Casa",
                    "roles": ["RESIDENCIA", "COBRANCA", "ENTREGA"],
                    "residenceType": "Casa",
                    "streetType": "Rua",
                    "street": "das Flores",
                    "number": "100",
                    "neighborhood": "Centro",
                    "zipCode": "01001000",
                    "city": "São Paulo",
                    "state": "SP",
                    "country": "Brasil"
                  }]
                }
                """;
    }
}
