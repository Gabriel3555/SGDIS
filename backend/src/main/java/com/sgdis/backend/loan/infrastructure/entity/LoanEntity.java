package com.sgdis.backend.loan.infrastructure.entity;

import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "loans")
public class LoanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lender_id")
    private UserEntity lender;

    @ManyToOne
    @JoinColumn(name = "item_id")
    private ItemEntity item;

    private String responsibleName;
    private String detailsLend;
    private String documentUrl;
    private String detailsReturn;
    private LocalDateTime lendAt;
    private LocalDateTime returnAt;
    private Boolean returned = false;
}
