package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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
    @Query("SELECT i FROM InventoryEntity i WHERE i.institution.id = :institutionId ORDER BY SIZE(i.items) DESC")
    Page<InventoryEntity> findPageByInstitutionId(@Param("institutionId") Long institutionId, Pageable pageable);
    
    @Query("SELECT i FROM InventoryEntity i WHERE i.institution.regional.id = :regionalId")
    Page<InventoryEntity> findPageByRegionalId(@Param("regionalId") Long regionalId, Pageable pageable);
    
    @Query("SELECT i FROM InventoryEntity i WHERE i.institution.id = :institutionId AND i.institution.regional.id = :regionalId")
    Page<InventoryEntity> findPageByRegionalIdAndInstitutionId(
            @Param("regionalId") Long regionalId,
            @Param("institutionId") Long institutionId,
            Pageable pageable
    );
    
    /**
     * Suma un valor al totalPrice del inventario.
     * Si totalPrice es null, se trata como 0.
     */
    @Modifying
    @Query("UPDATE InventoryEntity i SET i.totalPrice = COALESCE(i.totalPrice, 0) + :value WHERE i.id = :inventoryId")
    void addToTotalPrice(@Param("inventoryId") Long inventoryId, @Param("value") Double value);
    
    /**
     * Resta un valor del totalPrice del inventario.
     * Usa GREATEST para evitar valores negativos.
     */
    @Modifying
    @Query("UPDATE InventoryEntity i SET i.totalPrice = GREATEST(COALESCE(i.totalPrice, 0) - :value, 0) WHERE i.id = :inventoryId")
    void subtractFromTotalPrice(@Param("inventoryId") Long inventoryId, @Param("value") Double value);
    
    // Statistics queries
    long countByStatus(boolean status);
    
    @Query("SELECT COALESCE(SUM(i.totalPrice), 0) FROM InventoryEntity i")
    Double sumTotalPrice();
    
    // Regional statistics queries
    @Query("SELECT COUNT(i) FROM InventoryEntity i WHERE i.institution.regional.id = :regionalId")
    long countByRegionalId(@Param("regionalId") Long regionalId);
    
    @Query("SELECT COUNT(i) FROM InventoryEntity i WHERE i.institution.regional.id = :regionalId AND i.status = :status")
    long countByRegionalIdAndStatus(@Param("regionalId") Long regionalId, @Param("status") boolean status);
    
    @Query("SELECT COALESCE(SUM(i.totalPrice), 0) FROM InventoryEntity i WHERE i.institution.regional.id = :regionalId")
    Double sumTotalPriceByRegionalId(@Param("regionalId") Long regionalId);
    
    // Regional and Institution statistics queries
    @Query("SELECT COUNT(i) FROM InventoryEntity i WHERE i.institution.regional.id = :regionalId AND i.institution.id = :institutionId")
    long countByRegionalIdAndInstitutionId(@Param("regionalId") Long regionalId, @Param("institutionId") Long institutionId);
    
    @Query("SELECT COUNT(i) FROM InventoryEntity i WHERE i.institution.regional.id = :regionalId AND i.institution.id = :institutionId AND i.status = :status")
    long countByRegionalIdAndInstitutionIdAndStatus(@Param("regionalId") Long regionalId, @Param("institutionId") Long institutionId, @Param("status") boolean status);
    
    @Query("SELECT COALESCE(SUM(i.totalPrice), 0) FROM InventoryEntity i WHERE i.institution.regional.id = :regionalId AND i.institution.id = :institutionId")
    Double sumTotalPriceByRegionalIdAndInstitutionId(@Param("regionalId") Long regionalId, @Param("institutionId") Long institutionId);
    
    // Institution statistics queries
    @Query("SELECT COUNT(i) FROM InventoryEntity i WHERE i.institution.id = :institutionId")
    long countByInstitutionId(@Param("institutionId") Long institutionId);
    
    @Query("SELECT COUNT(i) FROM InventoryEntity i WHERE i.institution.id = :institutionId AND i.status = :status")
    long countByInstitutionIdAndStatus(@Param("institutionId") Long institutionId, @Param("status") boolean status);
    
    @Query("SELECT COALESCE(SUM(i.totalPrice), 0) FROM InventoryEntity i WHERE i.institution.id = :institutionId")
    Double sumTotalPriceByInstitutionId(@Param("institutionId") Long institutionId);
}
