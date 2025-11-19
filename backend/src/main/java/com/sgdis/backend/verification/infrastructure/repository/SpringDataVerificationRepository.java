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
}

