package com.sgdis.backend.dataInitializerDepartamentsAndCities.repositories;

import com.sgdis.backend.dataInitializerDepartamentsAndCities.entity.CityEntity;
import com.sgdis.backend.dataInitializerDepartamentsAndCities.entity.DepartamentEntity;
import org.springframework.data.jpa.repository.JpaRepository;


public interface SpringDataCitiesRepository extends JpaRepository<CityEntity, Long> {
    boolean existsByCityIgnoreCaseAndDepartament(String city, DepartamentEntity departament);
}