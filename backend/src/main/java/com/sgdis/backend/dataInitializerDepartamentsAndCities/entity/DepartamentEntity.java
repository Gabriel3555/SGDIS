package com.sgdis.backend.dataInitializerDepartamentsAndCities.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "departaments", uniqueConstraints = @UniqueConstraint(name = "uk_departament_name", columnNames = "departament"))
public class DepartamentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String departament;

    @Builder.Default
    @OneToMany(mappedBy = "departament", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CityEntity> cities = new ArrayList<>();
}
