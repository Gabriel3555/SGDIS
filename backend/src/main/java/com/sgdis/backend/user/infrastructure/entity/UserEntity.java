package com.sgdis.backend.user.infrastructure.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.domain.Role;
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
    @ManyToMany(fetch = FetchType.EAGER, mappedBy = "managers")
    private List<InventoryEntity> inventories;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "institution_id")
    private InstitutionEntity institution;
}
