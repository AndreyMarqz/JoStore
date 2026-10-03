package com.jostore.dev.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jostore.dev.model.address.ResidenceType;

public interface ResidenceTypeRepository extends JpaRepository<ResidenceType, UUID> {

    Optional<ResidenceType> findByDescriptionIgnoreCase(String description);
}
