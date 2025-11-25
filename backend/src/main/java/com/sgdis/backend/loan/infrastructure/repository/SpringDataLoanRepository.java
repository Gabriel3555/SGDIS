package com.sgdis.backend.loan.infrastructure.repository;

import com.sgdis.backend.loan.infrastructure.entity.LoanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataLoanRepository extends JpaRepository<LoanEntity, Long> {

    @Query("SELECT l FROM LoanEntity l WHERE l.item.id = :itemId ORDER BY l.lendAt DESC LIMIT 1")
    Optional<LoanEntity> findLastLoanByItemId(@Param("itemId") Long itemId);

    @Query("SELECT l FROM LoanEntity l WHERE l.item.id = :itemId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByItemId(@Param("itemId") Long itemId);

    @Query("SELECT l FROM LoanEntity l WHERE l.responsible.id = :responsibleId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByResponsibleId(@Param("responsibleId") Long responsibleId);

    @Query("SELECT l FROM LoanEntity l WHERE l.item.inventory.id = :inventoryId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByInventoryId(@Param("inventoryId") Long inventoryId);

    @Query("SELECT l FROM LoanEntity l WHERE l.item.inventory.institution.id = :institutionId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByInstitutionId(@Param("institutionId") Long institutionId);

    @Query("SELECT l FROM LoanEntity l WHERE l.item.inventory.institution.regional.id = :regionalId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByRegionalId(@Param("regionalId") Long regionalId);

    @Query("SELECT l FROM LoanEntity l WHERE l.item.inventory.institution.regional.id = :regionalId AND l.item.inventory.institution.id = :institutionId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByRegionalIdAndInstitutionId(@Param("regionalId") Long regionalId, @Param("institutionId") Long institutionId);

    @Query("SELECT l FROM LoanEntity l WHERE l.item.inventory.institution.regional.id = :regionalId AND l.item.inventory.institution.id = :institutionId AND l.item.inventory.id = :inventoryId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByRegionalIdAndInstitutionIdAndInventoryId(@Param("regionalId") Long regionalId, @Param("institutionId") Long institutionId, @Param("inventoryId") Long inventoryId);
}