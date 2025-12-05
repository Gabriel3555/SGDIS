package com.sgdis.backend.web.service;

import com.sgdis.backend.cancellation.infrastructure.repository.SpringDataCancellationRepository;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.loan.infrastructure.repository.SpringDataLoanRepository;
import com.sgdis.backend.transfers.domain.TransferStatus;
import com.sgdis.backend.transfers.infrastructure.repository.SpringDataTransferRepository;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.verification.infrastructure.repository.SpringDataVerificationRepository;
import com.sgdis.backend.web.dto.AdminInstitutionDashboardStatsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminInstitutionDashboardStatsService {

    private final SpringDataInventoryRepository inventoryRepository;
    private final SpringDataUserRepository userRepository;
    private final SpringDataTransferRepository transferRepository;
    private final SpringDataVerificationRepository verificationRepository;
    private final SpringDataLoanRepository loanRepository;
    private final SpringDataCancellationRepository cancellationRepository;

    @Transactional(readOnly = true)
    public AdminInstitutionDashboardStatsResponse getDashboardStats(Long institutionId) {
        log.info("Obteniendo estadísticas del dashboard de admin institution - InstitutionId: {}", institutionId);

        return AdminInstitutionDashboardStatsResponse.builder()
                .inventoryStats(getInventoryStats(institutionId))
                .userStats(getUserStats(institutionId))
                .transferStats(getTransferStats(institutionId))
                .verificationStats(getVerificationStats(institutionId))
                .loanStats(getLoanStats(institutionId))
                .cancellationStats(getCancellationStats(institutionId))
                .build();
    }

    private AdminInstitutionDashboardStatsResponse.InventoryStats getInventoryStats(Long institutionId) {
        var inventories = inventoryRepository.findAll().stream()
                .filter(inv -> inv.getInstitution() != null &&
                               inv.getInstitution().getId().equals(institutionId))
                .collect(Collectors.toList());

        long totalInventories = inventories.size();
        long activeInventories = inventories.stream()
                .filter(inv -> inv.isStatus())
                .count();
        long inactiveInventories = totalInventories - activeInventories;
        
        long totalItems = inventories.stream()
                .mapToLong(inv -> inv.getItems() != null ? inv.getItems().size() : 0)
                .sum();
        
        BigDecimal totalValue = inventories.stream()
                .map(inv -> BigDecimal.valueOf(inv.getTotalPrice() != null ? inv.getTotalPrice() : 0.0))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminInstitutionDashboardStatsResponse.InventoryStats.builder()
                .totalInventories(totalInventories)
                .activeInventories(activeInventories)
                .inactiveInventories(inactiveInventories)
                .totalItems(totalItems)
                .totalValue(totalValue)
                .build();
    }

    private AdminInstitutionDashboardStatsResponse.UserStats getUserStats(Long institutionId) {
        var users = userRepository.findAll().stream()
                .filter(user -> user.getInstitution() != null &&
                               user.getInstitution().getId().equals(institutionId))
                .collect(Collectors.toList());

        long totalUsers = users.size();
        long adminInstitutionCount = users.stream()
                .filter(u -> u.getRole() == Role.ADMIN_INSTITUTION)
                .count();
        long warehouseCount = users.stream()
                .filter(u -> u.getRole() == Role.WAREHOUSE)
                .count();
        long userCount = users.stream()
                .filter(u -> u.getRole() == Role.USER)
                .count();

        return AdminInstitutionDashboardStatsResponse.UserStats.builder()
                .totalUsers(totalUsers)
                .adminInstitutionCount(adminInstitutionCount)
                .warehouseCount(warehouseCount)
                .userCount(userCount)
                .build();
    }

    private AdminInstitutionDashboardStatsResponse.TransferStats getTransferStats(Long institutionId) {
        var transfers = transferRepository.findAll().stream()
                .filter(transfer -> {
                    // Filtrar por institución del inventario de origen o destino
                    return (transfer.getSourceInventory() != null &&
                            transfer.getSourceInventory().getInstitution() != null &&
                            transfer.getSourceInventory().getInstitution().getId().equals(institutionId)) ||
                           (transfer.getInventory() != null &&
                            transfer.getInventory().getInstitution() != null &&
                            transfer.getInventory().getInstitution().getId().equals(institutionId));
                })
                .collect(Collectors.toList());

        long total = transfers.size();
        long pending = transfers.stream()
                .filter(t -> t.getApprovalStatus() == TransferStatus.PENDING)
                .count();
        long approved = transfers.stream()
                .filter(t -> t.getApprovalStatus() == TransferStatus.APPROVED)
                .count();
        long rejected = transfers.stream()
                .filter(t -> t.getApprovalStatus() == TransferStatus.REJECTED)
                .count();

        return AdminInstitutionDashboardStatsResponse.TransferStats.builder()
                .total(total)
                .pending(pending)
                .approved(approved)
                .rejected(rejected)
                .build();
    }

    private AdminInstitutionDashboardStatsResponse.VerificationStats getVerificationStats(Long institutionId) {
        var verifications = verificationRepository.findAll().stream()
                .filter(verification -> verification.getItem() != null &&
                                        verification.getItem().getInventory() != null &&
                                        verification.getItem().getInventory().getInstitution() != null &&
                                        verification.getItem().getInventory().getInstitution().getId().equals(institutionId))
                .collect(Collectors.toList());

        long total = verifications.size();

        return AdminInstitutionDashboardStatsResponse.VerificationStats.builder()
                .total(total)
                .build();
    }

    private AdminInstitutionDashboardStatsResponse.LoanStats getLoanStats(Long institutionId) {
        var loans = loanRepository.findAll().stream()
                .filter(loan -> loan.getItem() != null &&
                               loan.getItem().getInventory() != null &&
                               loan.getItem().getInventory().getInstitution() != null &&
                               loan.getItem().getInventory().getInstitution().getId().equals(institutionId))
                .collect(Collectors.toList());

        long total = loans.size();

        return AdminInstitutionDashboardStatsResponse.LoanStats.builder()
                .total(total)
                .build();
    }

    private AdminInstitutionDashboardStatsResponse.CancellationStats getCancellationStats(Long institutionId) {
        var cancellations = cancellationRepository.findAll().stream()
                .filter(cancellation -> cancellation.getItems() != null &&
                                       cancellation.getItems().stream()
                                               .anyMatch(item -> item.getInventory() != null &&
                                                               item.getInventory().getInstitution() != null &&
                                                               item.getInventory().getInstitution().getId().equals(institutionId)))
                .collect(Collectors.toList());

        long total = cancellations.size();

        return AdminInstitutionDashboardStatsResponse.CancellationStats.builder()
                .total(total)
                .build();
    }
}

