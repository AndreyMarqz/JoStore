package com.jostore.dev.repository;

import com.jostore.dev.model.customer.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID>, JpaSpecificationExecutor<Customer> {

    Optional<Customer> findByCpf(String cpf);

    Optional<Customer> findByUserEmailIgnoreCase(String email);

    Optional<Customer> findTopByOrderByCodeDesc();
}
