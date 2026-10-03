package com.jostore.dev.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@SpringBootTest
@Testcontainers
class CustomerCrudIntegrationTest {

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:18-alpine")
            .withDatabaseName("jostore_test")
            .withUsername("jostore")
            .withPassword("jostore_test");

    private MockMvc mockMvc;

    @org.springframework.beans.factory.annotation.Autowired
    private JdbcTemplate jdbcTemplate;

    @org.springframework.beans.factory.annotation.Autowired
    private WebApplicationContext webApplicationContext;

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void cleanDatabase() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        jdbcTemplate.execute("TRUNCATE TABLE clientes, usuarios CASCADE");
    }

    @Test
    void shouldRegisterCustomerAndPersistItInPostgres() throws Exception {
        UUID customerId = registerCustomer();

        mockMvc.perform(get("/api/v1/customers/{customerId}", customerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Ana Cliente da Silva"))
                .andExpect(jsonPath("$.status").value("ATIVO"));

        org.assertj.core.api.Assertions.assertThat(
                jdbcTemplate.queryForObject("SELECT COUNT(*) FROM clientes WHERE cli_id = ?", Integer.class, customerId))
                .isEqualTo(1);
    }

    @Test
    void shouldUpdatePersistedCustomer() throws Exception {
        UUID customerId = registerCustomer();

        mockMvc.perform(put("/api/v1/customers/{customerId}", customerId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Ana Cliente Atualizada"))
                .andExpect(jsonPath("$.email").value("ana.atualizada@example.com"));

        mockMvc.perform(get("/api/v1/customers/{customerId}", customerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Ana Cliente Atualizada"));
    }

    @Test
    void shouldQueryPersistedCustomerByCpf() throws Exception {
        registerCustomer();

        mockMvc.perform(get("/api/v1/customers").param("cpf", "12345678901"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].fullName").value("Ana Cliente da Silva"))
                .andExpect(jsonPath("$.content[0].status").value("ATIVO"));
    }

    @Test
    void shouldInactivatePersistedCustomer() throws Exception {
        UUID customerId = registerCustomer();

        mockMvc.perform(patch("/api/v1/customers/{customerId}/status", customerId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INATIVO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INATIVO"));

        org.assertj.core.api.Assertions.assertThat(
                jdbcTemplate.queryForObject("SELECT cli_status FROM clientes WHERE cli_id = ?", String.class, customerId))
                .isEqualTo("INATIVO");
    }

    private UUID registerCustomer() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("CLI-000001"))
                .andReturn();

        return UUID.fromString((String) com.jayway.jsonpath.JsonPath.read(
                result.getResponse().getContentAsString(), "$.id"));
    }

    private String registrationJson() {
        return """
                { "fullName": "Ana Cliente da Silva", "cpf": "12345678901", "gender": "FEMININO",
                  "birthDate": "1999-03-15", "phone": { "type": "CELULAR", "areaCode": "11", "number": "999999999" },
                  "email": "ana@example.com", "password": "Senha@123", "confirmPassword": "Senha@123",
                  "addresses": [{ "label": "Casa", "roles": ["RESIDENCIA", "COBRANCA", "ENTREGA"],
                    "residenceType": "Casa", "streetType": "Rua", "street": "das Flores", "number": "100",
                    "neighborhood": "Centro", "zipCode": "01001000", "city": "Sao Paulo", "state": "SP", "country": "Brasil" }] }
                """;
    }

    private String updateJson() {
        return """
                { "fullName": "Ana Cliente Atualizada", "cpf": "12345678901", "gender": "FEMININO",
                  "birthDate": "1999-03-15", "phone": { "type": "CELULAR", "areaCode": "11", "number": "988888888" },
                  "email": "ana.atualizada@example.com" }
                """;
    }
}
