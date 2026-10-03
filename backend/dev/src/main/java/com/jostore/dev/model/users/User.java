package com.jostore.dev.model.users;

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
@Table(name = "usuarios")
@Getter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "usu_id", nullable = false)
    private UUID id;

    @Column(name = "usu_email", nullable = false, length = 254)
    private String email;

    @Column(name = "usu_senha", nullable = false, length = 60)
    private String passwordHash;

    public User(String email, String passwordHash) {
        changeEmail(email);
        changePasswordHash(passwordHash);
    }

    public void changeEmail(String email) {
        this.email = Objects.requireNonNull(email, "O e-mail é obrigatório.");
    }

    public void changePasswordHash(String passwordHash) {
        this.passwordHash = Objects.requireNonNull(passwordHash, "O hash da senha é obrigatório.");
    }
}
