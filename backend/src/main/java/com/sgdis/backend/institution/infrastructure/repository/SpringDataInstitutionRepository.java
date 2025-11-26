package com.sgdis.backend.institution.infrastructure.repository;

import com.sgdis.backend.data.regional.entity.RegionalEntity;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SpringDataInstitutionRepository extends JpaRepository<InstitutionEntity,Long>{

    List<InstitutionEntity> findInstitutionEntitiesByRegional(RegionalEntity regional);
    
    // Additional method to filter by regional ID directly
    @Query("SELECT i FROM InstitutionEntity i WHERE i.regional.id = :regionalId")
    List<InstitutionEntity> findByRegionalId(@Param("regionalId") Long regionalId);
    
    // Method to find all institutions with city and regional loaded
    @Query("SELECT i FROM InstitutionEntity i LEFT JOIN FETCH i.city LEFT JOIN FETCH i.regional")
    List<InstitutionEntity> findAllWithRelations();
}
