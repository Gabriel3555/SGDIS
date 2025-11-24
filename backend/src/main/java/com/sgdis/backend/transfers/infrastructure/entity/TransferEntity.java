package com.sgdis.backend.transfers.infrastructure.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.transfers.domain.TransferStatus;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "transfers")
public class TransferEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String details;

    @Builder.Default
    @Column(nullable = false)
    @ColumnDefault("true")
    private boolean status = true;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    @ColumnDefault("'PENDING'")
    private TransferStatus approvalStatus = TransferStatus.PENDING;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approval_notes", length = 500)
    private String approvalNotes;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_inventory_id")
    private InventoryEntity sourceInventory;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id")
    private InventoryEntity inventory;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itemId")
    private ItemEntity item;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id")
    private UserEntity requestedBy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private UserEntity approvedBy;

    @PrePersist
    private void onCreate() {
        if (this.requestedAt == null) {
            this.requestedAt = LocalDateTime.now();
        }
    }
    
}
