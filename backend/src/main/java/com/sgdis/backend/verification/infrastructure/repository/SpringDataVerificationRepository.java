package com.sgdis.backend.verification.infrastructure.repository;

import com.sgdis.backend.verification.infrastructure.entity.VerificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataVerificationRepository extends JpaRepository<VerificationEntity, Long> {
    @Query("SELECT v FROM VerificationEntity v WHERE v.item.id = :itemId ORDER BY v.createdAt DESC")
    List<VerificationEntity> findAllByItemIdOrderByCreatedAtDesc(@Param("itemId") Long itemId);
}

