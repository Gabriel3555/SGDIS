package com.sgdis.backend.data.departaments_cities.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "departament", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CityEntity> cities = new ArrayList<>();
}
