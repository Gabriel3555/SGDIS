package com.sgdis.backend.auditory.infrastructure.repository;

import com.sgdis.backend.auditory.infrastructure.entity.AuditoryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataAuditoryRepository extends JpaRepository<AuditoryEntity,Long> {
    Page<AuditoryEntity> findAllByOrderByDateDesc(Pageable pageable);
    
    @Query("SELECT a FROM AuditoryEntity a WHERE a.regional.id = :regionalId ORDER BY a.date DESC")
    Page<AuditoryEntity> findAllByRegionalIdOrderByDateDesc(@Param("regionalId") Long regionalId, Pageable pageable);
    
    @Query("SELECT a FROM AuditoryEntity a WHERE a.institution.id = :institutionId ORDER BY a.date DESC")
    Page<AuditoryEntity> findAllByInstitutionIdOrderByDateDesc(@Param("institutionId") Long institutionId, Pageable pageable);
    
    @Query("SELECT a FROM AuditoryEntity a WHERE " +
           "(:regionalId IS NULL OR a.regional.id = :regionalId) AND " +
           "(:institutionId IS NULL OR a.institution.id = :institutionId) AND " +
           "(:performerId IS NULL OR a.performer.id = :performerId) " +
           "ORDER BY a.date DESC")
    Page<AuditoryEntity> findAllWithFilters(
            @Param("regionalId") Long regionalId,
            @Param("institutionId") Long institutionId,
            @Param("performerId") Long performerId,
            Pageable pageable);
    
    @Query("SELECT COUNT(a) FROM AuditoryEntity a WHERE a.institution.id = :institutionId")
    long countByInstitutionId(@Param("institutionId") Long institutionId);
}
