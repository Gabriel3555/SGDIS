package com.sgdis.backend.inventory.infrastructure.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sgdis.backend.data.regional.entity.RegionalEntity;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.transfers.infrastructure.entity.TransferEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "inventories")

public class InventoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private UUID uuid;
    private String location;
    private String name;
    private String imgUrl;
    @Default
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean status = true;
    @ManyToOne(fetch = FetchType.EAGER)
    private UserEntity owner;

    @JsonIgnore
    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinTable(name = "managers_inventories", joinColumns = @JoinColumn(name = "inventory_id"), inverseJoinColumns = @JoinColumn(name = "manager_id"))
    private List<UserEntity> managers;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "institution_id")
    private InstitutionEntity institution;

    @OneToMany(mappedBy = "inventory")
    private List<ItemEntity> items;

    @ManyToMany(mappedBy = "mySignatories", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<UserEntity> signatories;

    @OneToMany(mappedBy = "inventory",cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<TransferEntity> transfers;

}