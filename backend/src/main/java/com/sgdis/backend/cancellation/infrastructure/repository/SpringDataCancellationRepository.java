package com.sgdis.backend.cancellation.infrastructure.repository;

import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    
    @Query("SELECT DISTINCT c FROM CancellationEntity c " +
           "LEFT JOIN FETCH c.requester " +
           "LEFT JOIN FETCH c.checker " +
           "LEFT JOIN FETCH c.items i " +
           "LEFT JOIN FETCH i.inventory inv " +
           "LEFT JOIN FETCH inv.institution inst " +
           "WHERE inv.institution.id = :institutionId " +
           "ORDER BY c.id DESC")
    List<CancellationEntity> findAllByInstitutionIdWithJoins(Long institutionId);
    
    @Query("SELECT DISTINCT c FROM CancellationEntity c " +
           "LEFT JOIN FETCH c.requester " +
           "LEFT JOIN FETCH c.checker " +
           "LEFT JOIN FETCH c.items i " +
           "LEFT JOIN FETCH i.inventory inv " +
           "LEFT JOIN FETCH inv.institution inst " +
           "WHERE inst.name = :institutionName " +
           "ORDER BY c.id DESC")
    List<CancellationEntity> findAllByInstitutionNameWithJoins(@Param("institutionName") String institutionName);
    
    @Query("SELECT DISTINCT c FROM CancellationEntity c " +
           "LEFT JOIN FETCH c.requester " +
           "LEFT JOIN FETCH c.checker " +
           "LEFT JOIN FETCH c.items i " +
           "WHERE i.id = :itemId " +
           "AND c.approved = true " +
           "AND c.refusedAt IS NULL " +
           "ORDER BY c.id DESC")
    List<CancellationEntity> findApprovedCancellationsByItemId(@Param("itemId") Long itemId);
    
    @Query("SELECT inv.name, COUNT(DISTINCT c.id) " +
           "FROM CancellationEntity c " +
           "JOIN c.items i " +
           "JOIN i.inventory inv " +
           "JOIN inv.institution inst " +
           "WHERE inst.id = :institutionId " +
           "AND c.approved = true " +
           "GROUP BY inv.id, inv.name")
    List<Object[]> countCancellationsByInventoryForInstitution(@Param("institutionId") Long institutionId);
    
    @Query("SELECT DISTINCT c FROM CancellationEntity c " +
           "LEFT JOIN FETCH c.requester " +
           "LEFT JOIN FETCH c.checker " +
           "LEFT JOIN FETCH c.items i " +
           "LEFT JOIN FETCH i.inventory inv " +
           "LEFT JOIN FETCH inv.institution inst " +
           "WHERE inv.id IN :inventoryIds " +
           "ORDER BY c.id DESC")
    List<CancellationEntity> findAllByInventoryIdsWithJoins(@Param("inventoryIds") List<Long> inventoryIds);
}