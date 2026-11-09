package com.jostore.dev.model.address;

import java.util.EnumSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import com.jostore.dev.model.customer.Customer;
import com.jostore.dev.model.enums.PurposeEnum;
import com.jostore.dev.model.enums.StateEnum;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "enderecos")
@Getter
@NoArgsConstructor
public class Address {
    @Column(name = "end_perfil", nullable = false)
    private boolean savedToProfile = true;
    public void useOnlyForCheckout() { savedToProfile = false; }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "end_id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "end_cli_id", nullable = false)
    private Customer customer;

    @ElementCollection(targetClass = PurposeEnum.class)
    @CollectionTable(name = "enderecos_finalidades", joinColumns = @JoinColumn(name = "end_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "end_finalidade", nullable = false)
    private Set<PurposeEnum> purposes = EnumSet.noneOf(PurposeEnum.class);

    @Column(name = "end_nome_ident", nullable = false)
    private String identification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "end_tipo_resid", nullable = false)
    private ResidenceType residenceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "end_tipo_lograd", nullable = false)
    private PublicPlaceType publicPlaceType;

    @Column(name = "end_lograd", nullable = false)
    private String publicPlace;

    @Column(name = "end_num", nullable = false)
    private String addressNumber;

    @Column(name = "end_bairro", nullable = false)
    private String neighborhood;

    @Column(name = "end_cep", nullable = false, length = 8)
    private String cep;

    @Column(name = "end_cidade", nullable = false)
    private String city;

    @Enumerated(EnumType.STRING)
    @Column(name = "end_estado", nullable = false, length = 2)
    private StateEnum state;

    @Column(name = "end_pais", nullable = false)
    private String country;

    @Column(name = "end_obs")
    private String observation;

    @Column(name = "end_complemento", length = 100)
    private String complement;

    public Address(
            Set<PurposeEnum> purposes,
            String identification,
            ResidenceType residenceType,
            PublicPlaceType publicPlaceType,
            String publicPlace,
            String addressNumber,
            String neighborhood,
            String cep,
            String city,
            StateEnum state,
            String country,
            String observation,
            String complement) {
        replacePurposes(purposes);
        updateData(identification, residenceType, publicPlaceType, publicPlace, addressNumber,
                neighborhood, cep, city, state, country, observation, complement);
    }

    public void updateData(
            String identification,
            ResidenceType residenceType,
            PublicPlaceType publicPlaceType,
            String publicPlace,
            String addressNumber,
            String neighborhood,
            String cep,
            String city,
            StateEnum state,
            String country,
            String observation,
            String complement) {
        this.identification = Objects.requireNonNull(identification, "A identificação do endereço é obrigatória.");
        this.residenceType = Objects.requireNonNull(residenceType, "O tipo de residência é obrigatório.");
        this.publicPlaceType = Objects.requireNonNull(publicPlaceType, "O tipo de logradouro é obrigatório.");
        this.publicPlace = Objects.requireNonNull(publicPlace, "O logradouro é obrigatório.");
        this.addressNumber = Objects.requireNonNull(addressNumber, "O número do endereço é obrigatório.");
        this.neighborhood = Objects.requireNonNull(neighborhood, "O bairro é obrigatório.");
        this.cep = Objects.requireNonNull(cep, "O CEP é obrigatório.");
        this.city = Objects.requireNonNull(city, "A cidade é obrigatória.");
        this.state = Objects.requireNonNull(state, "O estado é obrigatório.");
        this.country = Objects.requireNonNull(country, "O país é obrigatório.");
        this.observation = observation;
        this.complement = complement;
    }

    public void replacePurposes(Set<PurposeEnum> purposes) {
        if (purposes == null || purposes.isEmpty()) {
            throw new IllegalArgumentException("O endereço deve possuir ao menos uma finalidade.");
        }

        this.purposes.clear();
        this.purposes.addAll(purposes);
    }

    public void addPurpose(PurposeEnum purpose) {
        this.purposes.add(Objects.requireNonNull(purpose, "A finalidade do endereço é obrigatória."));
    }

    public void removePurpose(PurposeEnum purpose) {
        if (this.purposes.size() == 1 && this.purposes.contains(purpose)) {
            throw new IllegalStateException("O endereço deve possuir ao menos uma finalidade.");
        }

        this.purposes.remove(purpose);
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }
}
