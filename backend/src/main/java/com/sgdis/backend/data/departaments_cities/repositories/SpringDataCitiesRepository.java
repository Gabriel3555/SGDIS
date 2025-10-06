package com.sgdis.backend.data.departaments_cities.repositories;

import com.sgdis.backend.data.departaments_cities.entity.CityEntity;
import com.sgdis.backend.data.departaments_cities.entity.DepartamentEntity;
import org.springframework.data.jpa.repository.JpaRepository;


public interface SpringDataCitiesRepository extends JpaRepository<CityEntity, Long> {
    boolean existsByCityIgnoreCaseAndDepartament(String city, DepartamentEntity departament);
}