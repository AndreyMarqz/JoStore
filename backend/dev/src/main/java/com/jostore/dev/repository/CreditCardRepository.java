package com.jostore.dev.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jostore.dev.model.creditCards.CreditCard;

public interface CreditCardRepository extends JpaRepository<CreditCard, UUID> {

    Optional<CreditCard> findByIdAndCustomerId(UUID id, UUID customerId);
}
