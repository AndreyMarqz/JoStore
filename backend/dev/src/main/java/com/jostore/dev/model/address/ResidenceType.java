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
@Table(name = "tipos_residencia")
@Getter
@NoArgsConstructor
public class ResidenceType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "tip_resid_id")
    private UUID id;

    @Column(name = "tip_resid_desc", nullable = false)
    private String description;

    public ResidenceType(String description) {
        changeDescription(description);
    }

    public void changeDescription(String description) {
        this.description = Objects.requireNonNull(description, "A descrição do tipo de residência é obrigatória.");
    }
}
