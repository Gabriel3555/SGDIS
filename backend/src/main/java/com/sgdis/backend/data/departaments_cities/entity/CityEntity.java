package com.sgdis.backend.data.departaments_cities.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "cities",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_city_department",
                columnNames = {"city", "departament_id"}
        ))
public class CityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String city;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "departament_id", nullable = false)
    private DepartamentEntity departament;
}
