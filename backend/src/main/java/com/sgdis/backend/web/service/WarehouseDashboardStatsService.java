package com.sgdis.backend.web.service;

import com.sgdis.backend.auditory.infrastructure.repository.SpringDataAuditoryRepository;
import com.sgdis.backend.cancellation.infrastructure.repository.SpringDataCancellationRepository;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import com.sgdis.backend.loan.infrastructure.repository.SpringDataLoanRepository;
import com.sgdis.backend.transfers.domain.TransferStatus;
import com.sgdis.backend.transfers.infrastructure.repository.SpringDataTransferRepository;
import com.sgdis.backend.web.dto.WarehouseDashboardStatsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarehouseDashboardStatsService {

    private final SpringDataInventoryRepository inventoryRepository;
    private final SpringDataItemRepository itemRepository;
    private final SpringDataTransferRepository transferRepository;
    private final SpringDataLoanRepository loanRepository;
    private final SpringDataCancellationRepository cancellationRepository;
    private final SpringDataAuditoryRepository auditoryRepository;

    @Transactional(readOnly = true)
    public WarehouseDashboardStatsResponse getDashboardStats(Long institutionId) {
        log.info("Obteniendo estadísticas del dashboard de warehouse - InstitutionId: {}", institutionId);

        return WarehouseDashboardStatsResponse.builder()
                .inventoryStats(getInventoryStats(institutionId))
                .transferStats(getTransferStats(institutionId))
                .loanStats(getLoanStats(institutionId))
                .cancellationStats(getCancellationStats(institutionId))
                .auditActionsStats(getAuditActionsStats(institutionId))
                .build();
    }

    private WarehouseDashboardStatsResponse.InventoryStats getInventoryStats(Long institutionId) {
        long totalInventories = inventoryRepository.countByInstitutionId(institutionId);
        long activeInventories = inventoryRepository.countByInstitutionIdAndStatus(institutionId, true);
        long inactiveInventories = inventoryRepository.countByInstitutionIdAndStatus(institutionId, false);
        long totalItems = itemRepository.countByInstitutionId(institutionId);
        Double totalValue = inventoryRepository.sumTotalPriceByInstitutionId(institutionId);
        
        if (totalValue == null) {
            totalValue = 0.0;
        }

        return WarehouseDashboardStatsResponse.InventoryStats.builder()
                .totalInventories(totalInventories)
                .activeInventories(activeInventories)
                .inactiveInventories(inactiveInventories)
                .totalItems(totalItems)
                .totalValue(BigDecimal.valueOf(totalValue))
                .build();
    }

    private WarehouseDashboardStatsResponse.TransferStats getTransferStats(Long institutionId) {
        Long total = transferRepository.countByInstitutionId(institutionId);
        Long pending = transferRepository.countByInstitutionIdAndStatus(institutionId, TransferStatus.PENDING);
        Long approved = transferRepository.countByInstitutionIdAndStatus(institutionId, TransferStatus.APPROVED);
        Long rejected = transferRepository.countByInstitutionIdAndStatus(institutionId, TransferStatus.REJECTED);

        return WarehouseDashboardStatsResponse.TransferStats.builder()
                .total(total != null ? total : 0L)
                .pending(pending != null ? pending : 0L)
                .approved(approved != null ? approved : 0L)
                .rejected(rejected != null ? rejected : 0L)
                .build();
    }

    private WarehouseDashboardStatsResponse.LoanStats getLoanStats(Long institutionId) {
        // Use the repository method that efficiently counts loans by institution
        long total = loanRepository.countByInstitutionId(institutionId);

        return WarehouseDashboardStatsResponse.LoanStats.builder()
                .total(total)
                .build();
    }

    private WarehouseDashboardStatsResponse.CancellationStats getCancellationStats(Long institutionId) {
        var cancellations = cancellationRepository.findAllByInstitutionIdWithJoins(institutionId);
        
        long total = cancellations.size();
        long pending = cancellations.stream()
                .filter(c -> c.getApproved() == null || (!c.getApproved() && c.getRefusedAt() == null))
                .count();
        long approved = cancellations.stream()
                .filter(c -> c.getApproved() != null && c.getApproved() && c.getRefusedAt() == null)
                .count();
        long rejected = cancellations.stream()
                .filter(c -> c.getRefusedAt() != null)
                .count();

        return WarehouseDashboardStatsResponse.CancellationStats.builder()
                .total(total)
                .pending(pending)
                .approved(approved)
                .rejected(rejected)
                .build();
    }

    private WarehouseDashboardStatsResponse.AuditActionsStats getAuditActionsStats(Long institutionId) {
        long total = auditoryRepository.countByInstitutionId(institutionId);

        return WarehouseDashboardStatsResponse.AuditActionsStats.builder()
                .total(total)
                .build();
    }
}

