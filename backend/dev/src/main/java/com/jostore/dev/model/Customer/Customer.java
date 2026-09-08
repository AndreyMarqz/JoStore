package com.jostore.dev.model.Customer;

import com.jostore.dev.model.Enums.CustomerStatusEnum;
import com.jostore.dev.model.Enums.GenderEnum;
import com.jostore.dev.model.Enums.PhoneTypeEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity 
@Table (name = "customers")
@Getter
@Setter 
@NoArgsConstructor 
public class Customer {
    
    @Id 
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(name = "full_name", nullable = false, unique = true, length = 150)
    private String fullName;

    @Column(nullable = false, unique = true, length = 11)
    private String cpf;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private GenderEnum gender;

    @Column(name = "birth_date", nullable = false, unique = true, length = 10)
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "phone_type", nullable = false, length = 30)
    private PhoneTypeEnum phoneType;

    @Column(name = "phone_area_code", nullable = false, length = 2)
    private String phoneAreaCode;

    @Column(name = "phone_number", nullable = false, unique = true, length = 9)
    private String phoneNumber;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 60)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CustomerStatusEnum status = CustomerStatusEnum.ATIVO;

    @Column(nullable = false)
    private Integer ranking = 0;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void beforeInsert() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = CustomerStatusEnum.ATIVO;
        }

        if (ranking == null) {
            ranking = 0;
        }
    }

    @PreUpdate
    void beforeUpdate() {
        updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }
}
