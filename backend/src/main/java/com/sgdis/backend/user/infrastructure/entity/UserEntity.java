package com.sgdis.backend.user.infrastructure.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.verification.infrastructure.entity.VerificationEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String password;
    @Column(unique = true)
    private String email;
    private String fullName;
    private String jobTitle;
    private String laborDepartment;
    private String imgUrl;
    @Enumerated(EnumType.STRING)
    private Role role;
    private boolean status = true;

    @JsonIgnore
    @OneToOne(mappedBy = "owner") // "owner" es el nombre del campo en InventoryEntity
    private InventoryEntity myOwnedInventory;

    @JsonIgnore
    @ManyToMany(fetch = FetchType.EAGER, mappedBy = "managers")
    private List<InventoryEntity> myManagers;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "institution_id")
    private InstitutionEntity institution;

    @JsonIgnore
    @ManyToMany
    @JoinTable(name = "signatories_inventories", joinColumns = @JoinColumn(name = "signatory_id"), inverseJoinColumns = @JoinColumn(name = "inventory_id"))
    private List<InventoryEntity> mySignatories;

    @JsonIgnore
    @OneToMany(mappedBy = "user")
    private List<VerificationEntity> verifications;
}
