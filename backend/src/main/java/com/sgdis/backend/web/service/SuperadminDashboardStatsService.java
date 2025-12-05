package com.sgdis.backend.web.service;

import com.sgdis.backend.cancellation.infrastructure.repository.SpringDataCancellationRepository;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
import com.sgdis.backend.institution.infrastructure.repository.SpringDataInstitutionRepository;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.loan.infrastructure.repository.SpringDataLoanRepository;
import com.sgdis.backend.transfers.domain.TransferStatus;
import com.sgdis.backend.transfers.infrastructure.repository.SpringDataTransferRepository;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.verification.infrastructure.repository.SpringDataVerificationRepository;
import com.sgdis.backend.web.dto.SuperadminDashboardStatsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuperadminDashboardStatsService {

    private final SpringDataInventoryRepository inventoryRepository;
    private final SpringDataUserRepository userRepository;
    private final SpringDataRegionalRepository regionalRepository;
    private final SpringDataInstitutionRepository institutionRepository;
    private final SpringDataTransferRepository transferRepository;
    private final SpringDataVerificationRepository verificationRepository;
    private final SpringDataLoanRepository loanRepository;
    private final SpringDataCancellationRepository cancellationRepository;

    @Transactional(readOnly = true)
    public SuperadminDashboardStatsResponse getDashboardStats(Long regionalId, Long institutionId) {
        log.info("Obteniendo estadísticas del dashboard de superadmin - RegionalId: {}, InstitutionId: {}", regionalId, institutionId);

        return SuperadminDashboardStatsResponse.builder()
                .inventoryStats(getInventoryStats(regionalId, institutionId))
                .userStats(getUserStats(regionalId, institutionId))
                .centerStats(getCenterStats(regionalId))
                .transferStats(getTransferStats(regionalId, institutionId))
                .verificationStats(getVerificationStats(regionalId, institutionId))
                .loanStats(getLoanStats(regionalId, institutionId))
                .cancellationStats(getCancellationStats(regionalId, institutionId))
                .build();
    }

    private SuperadminDashboardStatsResponse.InventoryStats getInventoryStats(Long regionalId, Long institutionId) {
        var inventories = inventoryRepository.findAll().stream()
                .filter(inv -> {
                    if (institutionId != null) {
                        return inv.getInstitution() != null && 
                               inv.getInstitution().getId().equals(institutionId);
                    } else if (regionalId != null) {
                        return inv.getInstitution() != null && 
                               inv.getInstitution().getRegional() != null &&
                               inv.getInstitution().getRegional().getId().equals(regionalId);
                    }
                    return true;
                })
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

        return SuperadminDashboardStatsResponse.InventoryStats.builder()
                .totalInventories(totalInventories)
                .activeInventories(activeInventories)
                .inactiveInventories(inactiveInventories)
                .totalItems(totalItems)
                .totalValue(totalValue)
                .build();
    }

    private SuperadminDashboardStatsResponse.UserStats getUserStats(Long regionalId, Long institutionId) {
        var users = userRepository.findAll().stream()
                .filter(user -> {
                    if (institutionId != null) {
                        return user.getInstitution() != null && 
                               user.getInstitution().getId().equals(institutionId);
                    } else if (regionalId != null) {
                        return user.getInstitution() != null && 
                               user.getInstitution().getRegional() != null &&
                               user.getInstitution().getRegional().getId().equals(regionalId);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        long totalUsers = users.size();
        long superadminCount = users.stream()
                .filter(u -> u.getRole() == Role.SUPERADMIN)
                .count();
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

        return SuperadminDashboardStatsResponse.UserStats.builder()
                .totalUsers(totalUsers)
                .superadminCount(superadminCount)
                .adminRegionalCount(adminRegionalCount)
                .adminInstitutionCount(adminInstitutionCount)
                .warehouseCount(warehouseCount)
                .userCount(userCount)
                .build();
    }

    private SuperadminDashboardStatsResponse.CenterStats getCenterStats(Long regionalId) {
        long totalRegionals = regionalRepository.count();
        
        long totalInstitutions;
        if (regionalId != null) {
            totalInstitutions = institutionRepository.findByRegionalId(regionalId).size();
        } else {
            totalInstitutions = institutionRepository.count();
        }

        return SuperadminDashboardStatsResponse.CenterStats.builder()
                .totalRegionals(totalRegionals)
                .totalInstitutions(totalInstitutions)
                .build();
    }

    private SuperadminDashboardStatsResponse.TransferStats getTransferStats(Long regionalId, Long institutionId) {
        var transfers = transferRepository.findAll().stream()
                .filter(transfer -> {
                    if (institutionId != null) {
                        // Filtrar por institución del inventario de origen o destino
                        return (transfer.getSourceInventory() != null && 
                                transfer.getSourceInventory().getInstitution() != null &&
                                transfer.getSourceInventory().getInstitution().getId().equals(institutionId)) ||
                               (transfer.getInventory() != null && 
                                transfer.getInventory().getInstitution() != null &&
                                transfer.getInventory().getInstitution().getId().equals(institutionId));
                    } else if (regionalId != null) {
                        // Filtrar por regional del inventario de origen o destino
                        return (transfer.getSourceInventory() != null && 
                                transfer.getSourceInventory().getInstitution() != null &&
                                transfer.getSourceInventory().getInstitution().getRegional() != null &&
                                transfer.getSourceInventory().getInstitution().getRegional().getId().equals(regionalId)) ||
                               (transfer.getInventory() != null && 
                                transfer.getInventory().getInstitution() != null &&
                                transfer.getInventory().getInstitution().getRegional() != null &&
                                transfer.getInventory().getInstitution().getRegional().getId().equals(regionalId));
                    }
                    return true;
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

        return SuperadminDashboardStatsResponse.TransferStats.builder()
                .total(total)
                .pending(pending)
                .approved(approved)
                .rejected(rejected)
                .build();
    }

    private SuperadminDashboardStatsResponse.VerificationStats getVerificationStats(Long regionalId, Long institutionId) {
        long total;
        if (institutionId != null) {
            total = verificationRepository.countByInstitutionId(institutionId);
        } else if (regionalId != null) {
            total = verificationRepository.countByRegionalId(regionalId);
        } else {
            total = verificationRepository.count();
        }

        return SuperadminDashboardStatsResponse.VerificationStats.builder()
                .total(total)
                .build();
    }

    private SuperadminDashboardStatsResponse.LoanStats getLoanStats(Long regionalId, Long institutionId) {
        var loans = loanRepository.findAll().stream()
                .filter(loan -> {
                    if (institutionId != null) {
                        return loan.getItem() != null && 
                               loan.getItem().getInventory() != null &&
                               loan.getItem().getInventory().getInstitution() != null &&
                               loan.getItem().getInventory().getInstitution().getId().equals(institutionId);
                    } else if (regionalId != null) {
                        return loan.getItem() != null && 
                               loan.getItem().getInventory() != null &&
                               loan.getItem().getInventory().getInstitution() != null &&
                               loan.getItem().getInventory().getInstitution().getRegional() != null &&
                               loan.getItem().getInventory().getInstitution().getRegional().getId().equals(regionalId);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        long total = loans.size();

        return SuperadminDashboardStatsResponse.LoanStats.builder()
                .total(total)
                .build();
    }

    private SuperadminDashboardStatsResponse.CancellationStats getCancellationStats(Long regionalId, Long institutionId) {
        var cancellations = cancellationRepository.findAll().stream()
                .filter(cancellation -> {
                    if (institutionId != null) {
                        // Las cancelaciones tienen items, y cada item tiene un inventory con institution
                        return cancellation.getItems() != null &&
                               cancellation.getItems().stream()
                                       .anyMatch(item -> item.getInventory() != null &&
                                                       item.getInventory().getInstitution() != null &&
                                                       item.getInventory().getInstitution().getId().equals(institutionId));
                    } else if (regionalId != null) {
                        return cancellation.getItems() != null &&
                               cancellation.getItems().stream()
                                       .anyMatch(item -> item.getInventory() != null &&
                                                       item.getInventory().getInstitution() != null &&
                                                       item.getInventory().getInstitution().getRegional() != null &&
                                                       item.getInventory().getInstitution().getRegional().getId().equals(regionalId));
                    }
                    return true;
                })
                .collect(Collectors.toList());

        long total = cancellations.size();

        return SuperadminDashboardStatsResponse.CancellationStats.builder()
                .total(total)
                .build();
    }
}

