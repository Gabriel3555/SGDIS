package com.sgdis.backend.data.regional;

import com.sgdis.backend.data.departaments_cities.entity.DepartamentEntity;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "regionals")

public class RegionalEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String regionalCode;
    @ManyToOne(fetch = FetchType.EAGER)
    private DepartamentEntity departament;

    @OneToMany(mappedBy = "regional")
    private List<InstitutionEntity> institutions;
}
