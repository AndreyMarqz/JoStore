package com.jostore.dev.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jostore.dev.model.address.Address;

public interface AddressRepository extends JpaRepository<Address, UUID> {

    Optional<Address> findByIdAndCustomerId(UUID id, UUID customerId);
}
