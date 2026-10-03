package com.jostore.dev.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jostore.dev.model.address.PublicPlaceType;

public interface PublicPlaceTypeRepository extends JpaRepository<PublicPlaceType, UUID> {

    Optional<PublicPlaceType> findByDescriptionIgnoreCase(String description);
}
