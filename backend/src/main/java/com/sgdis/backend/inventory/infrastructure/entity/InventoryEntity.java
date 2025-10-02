package com.sgdis.backend.inventory.infrastructure.entity;

import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @Column(unique = true)
    private UUID uuid;
    private String location;
    private String name;
    @ManyToOne(fetch = FetchType.EAGER)
    private UserEntity owner;

    //@ManyToOne(fetch = FetchType.EAGER)
    //private UserEntity institucion;
}