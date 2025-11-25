package com.sgdis.backend.item.infrastructure.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.item.domain.Attribute;
import com.sgdis.backend.loan.infrastructure.entity.LoanEntity;
import com.sgdis.backend.transfers.infrastructure.entity.TransferEntity;
import com.sgdis.backend.verification.infrastructure.entity.VerificationEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "items")
public class ItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String irId;
    private String productName;
    private String wareHouseDescription;

    @Column(unique = true)
    private String licencePlateNumber;

    private String consecutiveNumber;
    private String skuDescription;
    private String descriptionElement;
    private LocalDate acquisitionDate;
    private Double acquisitionValue;
    private String ivId;
    private String allAttributes;
    private String location;
    private String responsible;
    private List<String> urlsImages;
    @Default
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean status = true;

    @JsonIgnore
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "item")
    private List<LoanEntity> loans;

    @ElementCollection
    @MapKeyEnumerated(EnumType.STRING)
    @Column(name = "attribute_value")
    private Map<Attribute, String> attributes;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id")
    private InventoryEntity inventory;

    @JsonIgnore
    @OneToMany(mappedBy = "item", fetch = FetchType.LAZY)
    private List<VerificationEntity> verifications;

    @JsonIgnore
    @OneToMany(mappedBy = "item",fetch = FetchType.LAZY)
    private List<TransferEntity> transfers;

    @ManyToMany(fetch = FetchType.LAZY, mappedBy = "items")
    private List<CancellationEntity> cancellations;
}
