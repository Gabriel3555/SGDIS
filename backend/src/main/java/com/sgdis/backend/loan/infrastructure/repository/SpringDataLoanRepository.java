package com.sgdis.backend.loan.infrastructure.repository;

import com.sgdis.backend.loan.infrastructure.entity.LoanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataLoanRepository extends JpaRepository<LoanEntity, Long> {

    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.item JOIN FETCH l.lender JOIN FETCH l.responsible WHERE l.item.id = :itemId ORDER BY l.lendAt DESC")
    List<LoanEntity> findLastLoanByItemId(@Param("itemId") Long itemId);

    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.item JOIN FETCH l.lender JOIN FETCH l.responsible WHERE l.item.id = :itemId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByItemId(@Param("itemId") Long itemId);

    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.item JOIN FETCH l.lender JOIN FETCH l.responsible WHERE l.responsible.id = :responsibleId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByResponsibleId(@Param("responsibleId") Long responsibleId);

    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.item JOIN FETCH l.lender JOIN FETCH l.responsible WHERE l.item.inventory.id = :inventoryId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByInventoryId(@Param("inventoryId") Long inventoryId);

    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.item JOIN FETCH l.lender JOIN FETCH l.responsible WHERE l.item.inventory.institution.id = :institutionId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByInstitutionId(@Param("institutionId") Long institutionId);

    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.item JOIN FETCH l.lender JOIN FETCH l.responsible WHERE l.item.inventory.institution.regional.id = :regionalId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByRegionalId(@Param("regionalId") Long regionalId);

    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.item JOIN FETCH l.lender JOIN FETCH l.responsible WHERE l.item.inventory.institution.regional.id = :regionalId AND l.item.inventory.institution.id = :institutionId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByRegionalIdAndInstitutionId(@Param("regionalId") Long regionalId, @Param("institutionId") Long institutionId);

    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.item JOIN FETCH l.lender JOIN FETCH l.responsible WHERE l.item.inventory.institution.regional.id = :regionalId AND l.item.inventory.institution.id = :institutionId AND l.item.inventory.id = :inventoryId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByRegionalIdAndInstitutionIdAndInventoryId(@Param("regionalId") Long regionalId, @Param("institutionId") Long institutionId, @Param("inventoryId") Long inventoryId);

    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.item JOIN FETCH l.lender JOIN FETCH l.responsible WHERE l.lender.id = :lenderId ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllByLenderId(@Param("lenderId") Long lenderId);

    @Query("SELECT l FROM LoanEntity l JOIN FETCH l.item JOIN FETCH l.lender JOIN FETCH l.responsible ORDER BY l.lendAt DESC")
    List<LoanEntity> findAllWithJoins();
    
    // Query to find duplicate loans in the last 2 minutes
    @Query("SELECT l FROM LoanEntity l WHERE l.item.id = :itemId " +
           "AND l.lender.id = :lenderId AND l.responsible.id = :responsibleId " +
           "AND l.lendAt >= :twoMinutesAgo ORDER BY l.lendAt DESC")
    List<LoanEntity> findDuplicateLoans(
            @Param("itemId") Long itemId,
            @Param("lenderId") Long lenderId,
            @Param("responsibleId") Long responsibleId,
            @Param("twoMinutesAgo") LocalDateTime twoMinutesAgo
    );
    
    // Query for counting total loans by regional
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.item.inventory.institution.regional.id = :regionalId")
    long countByRegionalId(@Param("regionalId") Long regionalId);
    
    // Query for counting active loans by regional (not returned)
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.item.inventory.institution.regional.id = :regionalId AND (l.returned IS NULL OR l.returned = false)")
    long countActiveByRegionalId(@Param("regionalId") Long regionalId);
    
    // Query for counting returned loans by regional
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.item.inventory.institution.regional.id = :regionalId AND l.returned = true")
    long countReturnedByRegionalId(@Param("regionalId") Long regionalId);
    
    // Institution statistics queries
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.item.inventory.institution.id = :institutionId")
    long countByInstitutionId(@Param("institutionId") Long institutionId);
    
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.item.inventory.institution.id = :institutionId AND (l.returned IS NULL OR l.returned = false)")
    long countActiveByInstitutionId(@Param("institutionId") Long institutionId);
    
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.item.inventory.institution.id = :institutionId AND l.returned = true")
    long countReturnedByInstitutionId(@Param("institutionId") Long institutionId);
}