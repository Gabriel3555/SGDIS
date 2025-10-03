package com.sgdis.backend.dataInitializerDepartamentsAndCities.repositories;

import com.sgdis.backend.dataInitializerDepartamentsAndCities.entity.CityEntity;
import com.sgdis.backend.dataInitializerDepartamentsAndCities.entity.DepartamentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataDepartamentsRepository extends JpaRepository<DepartamentEntity, Long> {
    Optional<DepartamentEntity> findByDepartamentIgnoreCase(String departament);
}