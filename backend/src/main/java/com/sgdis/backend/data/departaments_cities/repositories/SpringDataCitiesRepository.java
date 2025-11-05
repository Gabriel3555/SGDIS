package com.sgdis.backend.data.departaments_cities.repositories;

import com.sgdis.backend.data.departaments_cities.entity.CityEntity;
import com.sgdis.backend.data.departaments_cities.entity.DepartamentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface SpringDataCitiesRepository extends JpaRepository<CityEntity, Long> {
    boolean existsByCityIgnoreCaseAndDepartament(String city, DepartamentEntity departament);
    // agrega este (coincide EXACTO con lo que invocas en DataInitializer)
    Optional<CityEntity> findByCityIgnoreCaseAndDepartament(String city, DepartamentEntity departament);

    // opcional: variante por id si te resulta más cómodo
    Optional<CityEntity> findByCityIgnoreCaseAndDepartament_Id(String city, Long departamentId);
}