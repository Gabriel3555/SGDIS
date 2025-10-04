package com.sgdis.backend.data.departaments_cities.repositories;

import com.sgdis.backend.data.departaments_cities.entity.DepartamentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataDepartamentsRepository extends JpaRepository<DepartamentEntity, Long> {
    Optional<DepartamentEntity> findByDepartamentIgnoreCase(String departament);
}