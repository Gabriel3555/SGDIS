package com.sgdis.backend.web.service;

import com.sgdis.backend.cancellation.infrastructure.repository.SpringDataCancellationRepository;
import com.sgdis.backend.institution.infrastructure.repository.SpringDataInstitutionRepository;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.loan.infrastructure.repository.SpringDataLoanRepository;
import com.sgdis.backend.transfers.domain.TransferStatus;
import com.sgdis.backend.transfers.infrastructure.repository.SpringDataTransferRepository;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.verification.infrastructure.repository.SpringDataVerificationRepository;
import com.sgdis.backend.web.dto.AdminRegionalDashboardStatsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminRegionalDashboardStatsService {

    private final SpringDataInventoryRepository inventoryRepository;
    private final SpringDataUserRepository userRepository;
    private final SpringDataInstitutionRepository institutionRepository;
    private final SpringDataTransferRepository transferRepository;
    private final SpringDataVerificationRepository verificationRepository;
    private final SpringDataLoanRepository loanRepository;
    private final SpringDataCancellationRepository cancellationRepository;

    @Transactional(readOnly = true)
    public AdminRegionalDashboardStatsResponse getDashboardStats(Long regionalId) {
        log.info("Obteniendo estadísticas del dashboard de admin regional - RegionalId: {}", regionalId);

        return AdminRegionalDashboardStatsResponse.builder()
                .inventoryStats(getInventoryStats(regionalId))
                .userStats(getUserStats(regionalId))
                .centerStats(getCenterStats(regionalId))
                .transferStats(getTransferStats(regionalId))
                .verificationStats(getVerificationStats(regionalId))
                .loanStats(getLoanStats(regionalId))
                .cancellationStats(getCancellationStats(regionalId))
                .build();
    }

    private AdminRegionalDashboardStatsResponse.InventoryStats getInventoryStats(Long regionalId) {
        var inventories = inventoryRepository.findAll().stream()
                .filter(inv -> inv.getInstitution() != null &&
                               inv.getInstitution().getRegional() != null &&
                               inv.getInstitution().getRegional().getId().equals(regionalId))
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

        return AdminRegionalDashboardStatsResponse.InventoryStats.builder()
                .totalInventories(totalInventories)
                .activeInventories(activeInventories)
                .inactiveInventories(inactiveInventories)
                .totalItems(totalItems)
                .totalValue(totalValue)
                .build();
    }

    private AdminRegionalDashboardStatsResponse.UserStats getUserStats(Long regionalId) {
        var users = userRepository.findAll().stream()
                .filter(user -> user.getInstitution() != null &&
                               user.getInstitution().getRegional() != null &&
                               user.getInstitution().getRegional().getId().equals(regionalId))
                .collect(Collectors.toList());

        long totalUsers = users.size();
        long adminRegionalCount = users.stream()
                .filter(u -> u.getRole() == Role.ADMIN_REGIONAL)
                .count();
        long adminInstitutionCount = users.stream()
                .filter(u -> u.getRole() == Role.ADMIN_INSTITUTION)
                .count();
        long warehouseCount = users.stream()
                .filter(u -> u.getRole() == Role.WAREHOUSE)
                .count();
        long userCount = users.stream()
                .filter(u -> u.getRole() == Role.USER)
                .count();

        return AdminRegionalDashboardStatsResponse.UserStats.builder()
                .totalUsers(totalUsers)
                .adminRegionalCount(adminRegionalCount)
                .adminInstitutionCount(adminInstitutionCount)
                .warehouseCount(warehouseCount)
                .userCount(userCount)
                .build();
    }

    private AdminRegionalDashboardStatsResponse.CenterStats getCenterStats(Long regionalId) {
        long totalInstitutions = institutionRepository.findByRegionalId(regionalId).size();

        return AdminRegionalDashboardStatsResponse.CenterStats.builder()
                .totalInstitutions(totalInstitutions)
                .build();
    }

    private AdminRegionalDashboardStatsResponse.TransferStats getTransferStats(Long regionalId) {
        var transfers = transferRepository.findAll().stream()
                .filter(transfer -> {
                    // Filtrar por regional del inventario de origen o destino
                    return (transfer.getSourceInventory() != null &&
                            transfer.getSourceInventory().getInstitution() != null &&
                            transfer.getSourceInventory().getInstitution().getRegional() != null &&
                            transfer.getSourceInventory().getInstitution().getRegional().getId().equals(regionalId)) ||
                           (transfer.getInventory() != null &&
                            transfer.getInventory().getInstitution() != null &&
                            transfer.getInventory().getInstitution().getRegional() != null &&
                            transfer.getInventory().getInstitution().getRegional().getId().equals(regionalId));
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

        return AdminRegionalDashboardStatsResponse.TransferStats.builder()
                .total(total)
                .pending(pending)
                .approved(approved)
                .rejected(rejected)
                .build();
    }

    private AdminRegionalDashboardStatsResponse.VerificationStats getVerificationStats(Long regionalId) {
        long total = verificationRepository.countByRegionalId(regionalId);

        return AdminRegionalDashboardStatsResponse.VerificationStats.builder()
                .total(total)
                .build();
    }

    private AdminRegionalDashboardStatsResponse.LoanStats getLoanStats(Long regionalId) {
        var loans = loanRepository.findAll().stream()
                .filter(loan -> loan.getItem() != null &&
                               loan.getItem().getInventory() != null &&
                               loan.getItem().getInventory().getInstitution() != null &&
                               loan.getItem().getInventory().getInstitution().getRegional() != null &&
                               loan.getItem().getInventory().getInstitution().getRegional().getId().equals(regionalId))
                .collect(Collectors.toList());

        long total = loans.size();

        return AdminRegionalDashboardStatsResponse.LoanStats.builder()
                .total(total)
                .build();
    }

    private AdminRegionalDashboardStatsResponse.CancellationStats getCancellationStats(Long regionalId) {
        var cancellations = cancellationRepository.findAll().stream()
                .filter(cancellation -> cancellation.getItems() != null &&
                                       cancellation.getItems().stream()
                                               .anyMatch(item -> item.getInventory() != null &&
                                                               item.getInventory().getInstitution() != null &&
                                                               item.getInventory().getInstitution().getRegional() != null &&
                                                               item.getInventory().getInstitution().getRegional().getId().equals(regionalId)))
                .collect(Collectors.toList());

        long total = cancellations.size();

        return AdminRegionalDashboardStatsResponse.CancellationStats.builder()
                .total(total)
                .build();
    }
}

