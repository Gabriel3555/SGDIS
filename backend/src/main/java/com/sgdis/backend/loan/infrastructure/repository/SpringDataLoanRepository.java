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
}