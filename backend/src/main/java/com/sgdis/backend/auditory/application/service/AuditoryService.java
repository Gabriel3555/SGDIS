package com.sgdis.backend.auditory.application.service;

import com.sgdis.backend.auditory.application.dto.AuditoryResponse;
import com.sgdis.backend.auditory.application.dto.PagedAuditoryResponse;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
import com.sgdis.backend.auditory.application.port.in.ListAuditoryUseCase;
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.infrastructure.entity.AuditoryEntity;
import com.sgdis.backend.auditory.infrastructure.repository.SpringDataAuditoryRepository;
import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditoryService implements RecordActionUseCase, ListAuditoryUseCase {

    private final SpringDataAuditoryRepository springDataAuditoryRepository;
    private final AuthService authService;

    @Override
    public void recordAction(RecordActionRequest recordActionRequest) {
        UserEntity user = authService.getCurrentUser();
        springDataAuditoryRepository.save(
                AuditoryEntity.builder()
                        .action(recordActionRequest.action())
                        .performer(user)
                        .institution(user.getInstitution())
                        .date(ZonedDateTime.now(ZoneId.of("America/Bogota")).toLocalDateTime())
                        .regional(user.getInstitution() != null ? user.getInstitution().getRegional() : null)
                        .build()
        );
    }

    @Override
    public PagedAuditoryResponse listAuditories(Pageable pageable) {
        Page<AuditoryEntity> auditoryPage = springDataAuditoryRepository.findAllByOrderByDateDesc(pageable);
        
        List<AuditoryResponse> auditoryResponses = auditoryPage.getContent()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return PagedAuditoryResponse.builder()
                .auditories(auditoryResponses)
                .currentPage(auditoryPage.getNumber())
                .totalPages(auditoryPage.getTotalPages())
                .totalAuditories(auditoryPage.getTotalElements())
                .pageSize(auditoryPage.getSize())
                .first(auditoryPage.isFirst())
                .last(auditoryPage.isLast())
                .build();
    }

    public PagedAuditoryResponse listAuditoriesByRegional(Long regionalId, Pageable pageable) {
        Page<AuditoryEntity> auditoryPage = springDataAuditoryRepository.findAllByRegionalIdOrderByDateDesc(regionalId, pageable);
        
        List<AuditoryResponse> auditoryResponses = auditoryPage.getContent()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return PagedAuditoryResponse.builder()
                .auditories(auditoryResponses)
                .currentPage(auditoryPage.getNumber())
                .totalPages(auditoryPage.getTotalPages())
                .totalAuditories(auditoryPage.getTotalElements())
                .pageSize(auditoryPage.getSize())
                .first(auditoryPage.isFirst())
                .last(auditoryPage.isLast())
                .build();
    }

    private AuditoryResponse toResponse(AuditoryEntity entity) {
        return AuditoryResponse.builder()
                .id(entity.getId())
                .action(entity.getAction())
                .date(entity.getDate())
                .performerId(entity.getPerformer() != null ? entity.getPerformer().getId() : null)
                .performerName(entity.getPerformer() != null ? entity.getPerformer().getFullName() : null)
                .performerEmail(entity.getPerformer() != null ? entity.getPerformer().getEmail() : null)
                .performerImgUrl(entity.getPerformer() != null ? entity.getPerformer().getImgUrl() : null)
                .institutionId(entity.getInstitution() != null ? entity.getInstitution().getId() : null)
                .institutionName(entity.getInstitution() != null ? entity.getInstitution().getName() : null)
                .regionalId(entity.getRegional() != null ? entity.getRegional().getId() : null)
                .regionalName(entity.getRegional() != null ? entity.getRegional().getName() : null)
                .build();
    }
}
