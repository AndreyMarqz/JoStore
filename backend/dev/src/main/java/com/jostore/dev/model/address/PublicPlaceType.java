package com.jostore.dev.model.address;

import java.util.Objects;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tipos_logradouro")
@Getter
@NoArgsConstructor
public class PublicPlaceType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "tip_lograd_id")
    private UUID id;

    @Column(name = "tip_lograd_desc", nullable = false)
    private String description;

    public PublicPlaceType(String description) {
        changeDescription(description);
    }

    public void changeDescription(String description) {
        this.description = Objects.requireNonNull(description, "A descrição do tipo de logradouro é obrigatória.");
    }
}
