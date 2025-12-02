package com.sgdis.backend.cancellation.infrastructure.repository;

import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataCancellationRepository extends JpaRepository<CancellationEntity, Long> {
    
    @Query("SELECT DISTINCT c FROM CancellationEntity c " +
           "LEFT JOIN FETCH c.requester " +
           "LEFT JOIN FETCH c.checker " +
           "LEFT JOIN FETCH c.items " +
           "ORDER BY c.id DESC")
    List<CancellationEntity> findAllWithJoins();
    
    @Query("SELECT c FROM CancellationEntity c " +
           "JOIN c.items i " +
           "WHERE i.id = :itemId AND c.approved = true")
    List<CancellationEntity> findApprovedCancellationsByItemId(Long itemId);
}