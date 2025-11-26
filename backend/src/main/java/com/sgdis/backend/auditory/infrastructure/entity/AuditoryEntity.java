package com.sgdis.backend.auditory.infrastructure.entity;

import com.sgdis.backend.data.regional.entity.RegionalEntity;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "auditories")
public class AuditoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;
    private LocalDateTime date;

    @ManyToOne
    @JoinColumn(name = "performer_id")
    private UserEntity performer;

    @ManyToOne
    @JoinColumn(name = "regional_id")
    private RegionalEntity regional;

    @ManyToOne
    @JoinColumn(name = "institution_id")
    private InstitutionEntity institution;
}
