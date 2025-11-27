package com.sgdis.backend.transfers.infrastructure.repository;

import com.sgdis.backend.transfers.domain.TransferStatus;
import com.sgdis.backend.transfers.infrastructure.entity.TransferEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataTransferRepository extends JpaRepository<TransferEntity, Long> {

    @Query("SELECT t FROM TransferEntity t " +
            "LEFT JOIN FETCH t.item " +
            "LEFT JOIN FETCH t.inventory " +
            "LEFT JOIN FETCH t.sourceInventory " +
            "LEFT JOIN FETCH t.approvedBy " +
            "WHERE t.id = :id")
    Optional<TransferEntity> findByIdWithRelations(@Param("id") Long id);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END " +
            "FROM TransferEntity t WHERE t.item.id = :itemId AND t.approvalStatus = :status")
    boolean existsByItemIdAndStatus(@Param("itemId") Long itemId, @Param("status") TransferStatus status);

    @Query("""
            SELECT t FROM TransferEntity t
            LEFT JOIN FETCH t.item
            LEFT JOIN FETCH t.inventory
            LEFT JOIN FETCH t.sourceInventory
            LEFT JOIN FETCH t.requestedBy
            LEFT JOIN FETCH t.approvedBy
            WHERE (t.inventory.id = :inventoryId OR t.sourceInventory.id = :inventoryId)
            ORDER BY t.requestedAt DESC
            """)
    List<TransferEntity> findAllByInventory(@Param("inventoryId") Long inventoryId);

    @Query("""
            SELECT t FROM TransferEntity t
            LEFT JOIN FETCH t.item
            LEFT JOIN FETCH t.inventory
            LEFT JOIN FETCH t.sourceInventory
            LEFT JOIN FETCH t.requestedBy
            LEFT JOIN FETCH t.approvedBy
            WHERE t.item.id = :itemId
            ORDER BY t.requestedAt DESC
            """)
    List<TransferEntity> findAllByItemId(@Param("itemId") Long itemId);

    @Query("SELECT t FROM TransferEntity t ORDER BY t.requestedAt DESC")
    Page<TransferEntity> findAllOrderedByRequestedAt(Pageable pageable);

    @Query("""
            SELECT DISTINCT t FROM TransferEntity t
            LEFT JOIN FETCH t.item
            LEFT JOIN FETCH t.inventory inv
            LEFT JOIN FETCH t.sourceInventory srcInv
            LEFT JOIN FETCH t.requestedBy
            LEFT JOIN FETCH t.approvedBy
            WHERE (inv.institution.regional.id = :regionalId OR srcInv.institution.regional.id = :regionalId)
            ORDER BY t.requestedAt DESC
            """)
    Page<TransferEntity> findAllByRegionalId(@Param("regionalId") Long regionalId, Pageable pageable);
}

