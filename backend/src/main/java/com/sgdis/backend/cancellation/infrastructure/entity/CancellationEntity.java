package com.sgdis.backend.cancellation.infrastructure.entity;

import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "cancelations")
public class CancellationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private UUID uuid = UUID.randomUUID();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "cancelations_items")
    private List<ItemEntity> items;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private UserEntity requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checker_id")
    private UserEntity checker;

    private LocalDateTime requestedAt;
    private String reason;

    private LocalDateTime approvedAt;
    private LocalDateTime refusedAt;
    private String comment;

    private Boolean approved = false;

    private String urlFormat;
    private String urlCorrectedExample;
}