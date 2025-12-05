package com.sgdis.backend.verification.infrastructure.repository;

import com.sgdis.backend.verification.infrastructure.entity.VerificationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataVerificationRepository extends JpaRepository<VerificationEntity, Long> {
    @Query("SELECT v FROM VerificationEntity v WHERE v.item.id = :itemId ORDER BY v.createdAt DESC")
    List<VerificationEntity> findAllByItemIdOrderByCreatedAtDesc(@Param("itemId") Long itemId);

    @Query("SELECT v FROM VerificationEntity v WHERE v.item.id = :itemId ORDER BY v.createdAt DESC")
    Page<VerificationEntity> findAllByItemId(@Param("itemId") Long itemId, Pageable pageable);

    @Query("SELECT v FROM VerificationEntity v WHERE v.item.inventory.id = :inventoryId ORDER BY v.createdAt DESC")
    List<VerificationEntity> findLatestByInventory(@Param("inventoryId") Long inventoryId, Pageable pageable);
    
    @Query("SELECT v FROM VerificationEntity v JOIN FETCH v.item i JOIN FETCH i.inventory WHERE i.inventory.id = :inventoryId ORDER BY v.id DESC")
    Page<VerificationEntity> findAllByInventoryId(@Param("inventoryId") Long inventoryId, Pageable pageable);
    
    @Query("SELECT v FROM VerificationEntity v JOIN FETCH v.item i JOIN FETCH i.inventory inv WHERE inv.institution.id = :institutionId ORDER BY v.id DESC")
    Page<VerificationEntity> findAllByInstitutionId(@Param("institutionId") Long institutionId, Pageable pageable);
    
    @Query("SELECT v FROM VerificationEntity v JOIN FETCH v.item i JOIN FETCH i.inventory inv JOIN FETCH inv.institution inst WHERE inst.regional.id = :regionalId ORDER BY v.id DESC")
    Page<VerificationEntity> findAllByRegionalId(@Param("regionalId") Long regionalId, Pageable pageable);
    
    // Query for counting total verifications (without JOIN FETCH for pagination count)
    @Query("SELECT COUNT(v) FROM VerificationEntity v")
    long countAll();
    
    // Query for counting verifications by inventory
    @Query("SELECT COUNT(v) FROM VerificationEntity v WHERE v.item.inventory.id = :inventoryId")
    long countByInventoryId(@Param("inventoryId") Long inventoryId);
    
    // Query for counting verifications by institution
    @Query("SELECT COUNT(v) FROM VerificationEntity v WHERE v.item.inventory.institution.id = :institutionId")
    long countByInstitutionId(@Param("institutionId") Long institutionId);
    
    // Query for counting verifications by regional
    @Query("SELECT COUNT(v) FROM VerificationEntity v WHERE v.item.inventory.institution.regional.id = :regionalId")
    long countByRegionalId(@Param("regionalId") Long regionalId);
    
    // Query for counting completed verifications by regional (those with photoUrl)
    @Query("SELECT COUNT(v) FROM VerificationEntity v WHERE v.item.inventory.institution.regional.id = :regionalId AND v.photoUrl IS NOT NULL AND v.photoUrl != ''")
    long countCompletedByRegionalId(@Param("regionalId") Long regionalId);
    
    // Query for counting verifications with evidence by regional (those with photoUrl)
    @Query("SELECT COUNT(v) FROM VerificationEntity v WHERE v.item.inventory.institution.regional.id = :regionalId AND v.photoUrl IS NOT NULL AND v.photoUrl != ''")
    long countWithEvidenceByRegionalId(@Param("regionalId") Long regionalId);
    
    // Query to get all verifications with JOIN FETCH for loading relationships
    @Query("SELECT DISTINCT v FROM VerificationEntity v JOIN FETCH v.item i JOIN FETCH i.inventory ORDER BY v.id DESC")
    List<VerificationEntity> findAllWithJoins();
    
    // Institution queries for recent verifications
    @Query("SELECT v FROM VerificationEntity v JOIN FETCH v.item i JOIN FETCH i.inventory inv WHERE inv.institution.id = :institutionId ORDER BY v.createdAt DESC")
    Page<VerificationEntity> findAllByInstitutionIdOrderedByCreatedAt(@Param("institutionId") Long institutionId, Pageable pageable);
    
    // Query to get verifications for user's inventories (owner, manager, or signatory)
    @Query("SELECT DISTINCT v FROM VerificationEntity v JOIN FETCH v.item i JOIN FETCH i.inventory inv WHERE inv.id IN :inventoryIds ORDER BY v.id DESC")
    Page<VerificationEntity> findAllByInventoryIds(@Param("inventoryIds") List<Long> inventoryIds, Pageable pageable);
    
    // Query to get verifications by item IDs
    @Query("SELECT DISTINCT v FROM VerificationEntity v JOIN FETCH v.item i JOIN FETCH i.inventory WHERE i.id IN :itemIds ORDER BY v.id DESC")
    Page<VerificationEntity> findAllByItemIds(@Param("itemIds") List<Long> itemIds, Pageable pageable);
    
    // Query to count verifications by item ID
    @Query("SELECT COUNT(v) FROM VerificationEntity v WHERE v.item.id = :itemId")
    long countByItemId(@Param("itemId") Long itemId);
}

