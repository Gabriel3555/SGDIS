package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataInventoryRepository extends JpaRepository<InventoryEntity, Long> {
    List<InventoryEntity> findInventoryEntitiesByOwnerId(Long ownerId);
    Optional<InventoryEntity> findByNameAndOwner(String name, UserEntity owner);

    @Query("SELECT i FROM InventoryEntity i JOIN i.managers m WHERE m.id = :managerId")
    List<InventoryEntity> findInventoryEntitiesByManagerId(@Param("managerId") Long managerId);

    @Query("SELECT i FROM InventoryEntity i JOIN i.signatories s WHERE s.id = :signatoryId")
    List<InventoryEntity> findInventoryEntitiesBySignatoryId(@Param("signatoryId") Long signatoryId);

    InventoryEntity findInventoryEntityByOwner(UserEntity owner);
    
    List<InventoryEntity> findByInstitution(InstitutionEntity institution);
    
    @Query("SELECT i FROM InventoryEntity i WHERE i.institution.id = :institutionId")
    List<InventoryEntity> findByInstitutionId(@Param("institutionId") Long institutionId);
    
    @Query("SELECT i FROM InventoryEntity i WHERE i.institution.regional.id = :regionalId")
    List<InventoryEntity> findByRegionalId(@Param("regionalId") Long regionalId);
    
    // Métodos paginados
    @Query("SELECT i FROM InventoryEntity i WHERE i.institution.id = :institutionId")
    Page<InventoryEntity> findPageByInstitutionId(@Param("institutionId") Long institutionId, Pageable pageable);
    
    @Query("SELECT i FROM InventoryEntity i WHERE i.institution.regional.id = :regionalId")
    Page<InventoryEntity> findPageByRegionalId(@Param("regionalId") Long regionalId, Pageable pageable);
    
    @Query("SELECT i FROM InventoryEntity i WHERE i.institution.id = :institutionId AND i.institution.regional.id = :regionalId")
    Page<InventoryEntity> findPageByRegionalIdAndInstitutionId(
            @Param("regionalId") Long regionalId,
            @Param("institutionId") Long institutionId,
            Pageable pageable
    );
}
