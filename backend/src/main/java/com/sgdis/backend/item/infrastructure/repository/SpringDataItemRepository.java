package com.sgdis.backend.item.infrastructure.repository;

import com.sgdis.backend.item.domain.Attribute;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataItemRepository extends JpaRepository<ItemEntity, Long> {

    @Query("SELECT i FROM ItemEntity i WHERE i.inventory.id = :inventoryId " +
           "AND NOT EXISTS (SELECT 1 FROM com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity c JOIN c.items ci " +
           "WHERE ci.id = i.id AND c.approved = true AND c.refusedAt IS NULL)")
    Page<ItemEntity> findByInventoryId(@Param("inventoryId") Long inventoryId, Pageable pageable);

    @Query("SELECT i FROM ItemEntity i LEFT JOIN FETCH i.inventory inv LEFT JOIN FETCH inv.institution WHERE i.licencePlateNumber = :licencePlateNumber")
    Optional<ItemEntity> findByLicencePlateNumber(@Param("licencePlateNumber") String licencePlateNumber);

    @Query("SELECT DISTINCT i FROM ItemEntity i LEFT JOIN FETCH i.inventory inv LEFT JOIN FETCH inv.institution, IN(i.attributes) a WHERE KEY(a) = :attributeKey AND VALUE(a) = :attributeValue")
    Optional<ItemEntity> findByAttribute(@Param("attributeKey") Attribute attributeKey, @Param("attributeValue") String attributeValue);

    @Query("SELECT i FROM ItemEntity i WHERE i.inventory.id = :inventoryId " +
           "AND NOT EXISTS (SELECT 1 FROM com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity c JOIN c.items ci " +
           "WHERE ci.id = i.id AND c.approved = true AND c.refusedAt IS NULL)")
    List<ItemEntity> findAllByInventoryId(@Param("inventoryId") Long inventoryId);
    
    // Statistics queries
    @Query("SELECT COUNT(i) FROM ItemEntity i WHERE i.inventory.institution.regional.id = :regionalId")
    long countByRegionalId(@Param("regionalId") Long regionalId);
    
    @Query("SELECT COUNT(i) FROM ItemEntity i WHERE i.inventory.institution.regional.id = :regionalId AND i.inventory.institution.id = :institutionId")
    long countByRegionalIdAndInstitutionId(@Param("regionalId") Long regionalId, @Param("institutionId") Long institutionId);
    
    // Institution statistics queries
    @Query("SELECT COUNT(i) FROM ItemEntity i WHERE i.inventory.institution.id = :institutionId")
    long countByInstitutionId(@Param("institutionId") Long institutionId);
    
    // Inventory statistics queries
    @Query("SELECT COUNT(i) FROM ItemEntity i WHERE i.inventory.id = :inventoryId " +
           "AND NOT EXISTS (SELECT 1 FROM com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity c JOIN c.items ci " +
           "WHERE ci.id = i.id AND c.approved = true AND c.refusedAt IS NULL)")
    long countByInventoryId(@Param("inventoryId") Long inventoryId);
    
    @Query("SELECT COUNT(i) FROM ItemEntity i WHERE i.inventory.id = :inventoryId AND i.status = true " +
           "AND NOT EXISTS (SELECT 1 FROM com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity c JOIN c.items ci " +
           "WHERE ci.id = i.id AND c.approved = true AND c.refusedAt IS NULL)")
    long countActiveByInventoryId(@Param("inventoryId") Long inventoryId);
    
    @Query("SELECT COUNT(i) FROM ItemEntity i WHERE i.inventory.id = :inventoryId AND i.status = false " +
           "AND NOT EXISTS (SELECT 1 FROM com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity c JOIN c.items ci " +
           "WHERE ci.id = i.id AND c.approved = true AND c.refusedAt IS NULL)")
    long countInactiveByInventoryId(@Param("inventoryId") Long inventoryId);
}