package com.sgdis.backend.loan.application.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import com.sgdis.backend.loan.application.dto.LendItemRequest;
import com.sgdis.backend.loan.application.dto.LendItemResponse;
import com.sgdis.backend.loan.application.dto.LoanResponse;
import com.sgdis.backend.loan.application.dto.ReturnItemRequest;
import com.sgdis.backend.loan.application.dto.ReturnItemResponse;
import com.sgdis.backend.loan.application.port.GetLastLoanByItemUseCase;
import com.sgdis.backend.loan.application.port.GetLoansByItemUseCase;
import com.sgdis.backend.loan.application.port.GetMyLoansUseCase;
import com.sgdis.backend.loan.application.port.LendItemUseCase;
import com.sgdis.backend.loan.application.port.ReturnItemUseCase;
import com.sgdis.backend.loan.infrastructure.entity.LoanEntity;
import com.sgdis.backend.loan.infrastructure.repository.SpringDataLoanRepository;
import com.sgdis.backend.loan.mapper.LoanMapper;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
// Auditoría
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService implements LendItemUseCase, ReturnItemUseCase, GetLoansByItemUseCase, GetLastLoanByItemUseCase, GetMyLoansUseCase {

    private final AuthService authService;
    private final SpringDataLoanRepository loanRepository;
    private final SpringDataItemRepository itemRepository;
    private final SpringDataUserRepository userRepository;
    private final RecordActionUseCase recordActionUseCase;

    @Override
    @Transactional
    public LendItemResponse lendItem(LendItemRequest request) {
        UserEntity user = authService.getCurrentUser();

        ItemEntity item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        UserEntity responsible = userRepository.findById(request.responsibleId())
                .orElseThrow(() -> new ResourceNotFoundException("Responsible user not found"));

        // First, check if there are any active loans (not returned) in the database
        // This is the source of truth for whether an item is currently lent
        List<LoanEntity> allLoans = loanRepository.findAllByItemId(request.itemId());
        List<LoanEntity> activeLoans = allLoans.stream()
                .filter(loan -> loan.getReturned() == null || !loan.getReturned())
                .collect(Collectors.toList());

        // If there are active loans, the item cannot be lent
        if (!activeLoans.isEmpty()) {
            // Get the responsible person from the most recent active loan
            LoanEntity mostRecentActiveLoan = activeLoans.stream()
                    .max((l1, l2) -> {
                        if (l1.getLendAt() == null && l2.getLendAt() == null) return 0;
                        if (l1.getLendAt() == null) return -1;
                        if (l2.getLendAt() == null) return 1;
                        return l1.getLendAt().compareTo(l2.getLendAt());
                    })
                    .orElse(activeLoans.get(0));
            
            String responsibleName = mostRecentActiveLoan.getResponsible() != null 
                    ? mostRecentActiveLoan.getResponsible().getFullName() 
                    : "Unknown";
            
            throw new IllegalStateException("Item cannot be lent because it is currently lent to: " + responsibleName);
        }

        // Double-check just before creating the loan to prevent race conditions
        // This ensures that even if two requests arrive simultaneously, only one will succeed
        List<LoanEntity> doubleCheckLoans = loanRepository.findAllByItemId(request.itemId());
        List<LoanEntity> doubleCheckActiveLoans = doubleCheckLoans.stream()
                .filter(loan -> loan.getReturned() == null || !loan.getReturned())
                .collect(Collectors.toList());
        
        if (!doubleCheckActiveLoans.isEmpty()) {
            LoanEntity mostRecentActiveLoan = doubleCheckActiveLoans.stream()
                    .max((l1, l2) -> {
                        if (l1.getLendAt() == null && l2.getLendAt() == null) return 0;
                        if (l1.getLendAt() == null) return -1;
                        if (l2.getLendAt() == null) return 1;
                        return l1.getLendAt().compareTo(l2.getLendAt());
                    })
                    .orElse(doubleCheckActiveLoans.get(0));
            
            String responsibleName = mostRecentActiveLoan.getResponsible() != null 
                    ? mostRecentActiveLoan.getResponsible().getFullName() 
                    : "Unknown";
            
            throw new IllegalStateException("Item cannot be lent because it is currently lent to: " + responsibleName);
        }

        // If there are no active loans but the item has a responsible field set,
        // this indicates a data inconsistency (e.g., loan was deleted from DB but item wasn't updated)
        // Auto-fix by clearing the responsible field
        if (item.getResponsible() != null && !item.getResponsible().trim().isEmpty()) {
            // Data inconsistency detected: clear the responsible field
            item.setResponsible("");
            itemRepository.save(item);
        }

        LoanEntity loanEntity = LoanMapper.toEntity(request, item, user, responsible);

        // For USER role, explicitly set returned = false to ensure it's not returned by default
        if (user.getRole() != null && user.getRole() == Role.USER) {
            loanEntity.setReturned(false);
        }

        loanEntity.setItem(item);
        if (item.getLoans() == null) {
            item.setLoans(new ArrayList<>());
        }
        if (!item.getLoans().contains(loanEntity)) {
            item.getLoans().add(loanEntity);
        }

        item.setLocation("");
        item.setResponsible(responsible.getFullName());

        itemRepository.save(item);
        loanRepository.save(loanEntity);

        // Verificar y eliminar préstamos duplicados en los últimos 2 minutos
        checkAndRemoveDuplicateLoans(loanEntity);

        // Registrar auditoría
        String itemName = item.getProductName() != null ? item.getProductName() : "sin nombre";
        String inventoryName = item.getInventory() != null && item.getInventory().getName() != null 
                ? item.getInventory().getName() : "sin nombre";
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Item prestado: %s (ID: %d) - Prestado a: %s (%s) - Inventario: %s", 
                        itemName,
                        item.getId(),
                        responsible.getFullName(),
                        responsible.getEmail(),
                        inventoryName)
        ));

        return new LendItemResponse(user.getFullName(), "Item prestado exitosamente a " + responsible.getFullName());
    }

    @Override
    public ReturnItemResponse returnItem(ReturnItemRequest request) {
        UserEntity user = authService.getCurrentUser();

        LoanEntity loanEntity = loanRepository.findById(request.loanId())
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (Boolean.TRUE.equals(loanEntity.getReturned())) {
            throw new IllegalStateException("Item already returned");
        }

        loanEntity.setReturned(true);
        loanEntity.setDetailsReturn(request.detailsReturn());
        loanEntity.setReturnAt(LocalDateTime.now());

        ItemEntity item = loanEntity.getItem();
        if (item != null) {
            if (item.getLoans() == null) {
                item.setLoans(new ArrayList<>());
            }
            if (!item.getLoans().contains(loanEntity)) {
                item.getLoans().add(loanEntity);
            }
        }

        ItemEntity itemEntity = itemRepository.findById(loanEntity.getItem().getId()).orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        itemEntity.setLocation(itemEntity.getInventory().getLocation());
        itemEntity.setResponsible("");

        itemRepository.save(itemEntity);
        loanRepository.save(loanEntity);

        // Registrar auditoría
        String itemName = itemEntity.getProductName() != null ? itemEntity.getProductName() : "sin nombre";
        String responsibleName = loanEntity.getResponsible() != null ? loanEntity.getResponsible().getFullName() : "N/A";
        String inventoryName = itemEntity.getInventory() != null && itemEntity.getInventory().getName() != null 
                ? itemEntity.getInventory().getName() : "sin nombre";
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Item devuelto: %s (ID: %d) - Devuelto por: %s - Inventario: %s", 
                        itemName,
                        itemEntity.getId(),
                        responsibleName,
                        inventoryName)
        ));

        return new ReturnItemResponse(user.getFullName(), "Item devuelto exitosamente");
    }

    /**
     * Verifica si hay préstamos duplicados en los últimos 2 minutos y elimina los duplicados.
     * Dos préstamos se consideran duplicados si tienen el mismo item, lender y responsible.
     * Si hay 2 o más duplicados, se eliminan todos menos el más reciente.
     */
    private void checkAndRemoveDuplicateLoans(LoanEntity savedLoan) {
        if (savedLoan.getItem() == null || savedLoan.getLender() == null || savedLoan.getResponsible() == null || savedLoan.getLendAt() == null) {
            return; // No se puede verificar si falta información esencial
        }

        // Calcular la fecha de hace 2 minutos
        LocalDateTime twoMinutesAgo = savedLoan.getLendAt().minus(2, ChronoUnit.MINUTES);

        // Buscar préstamos duplicados en los últimos 2 minutos
        List<LoanEntity> duplicateLoans = loanRepository.findDuplicateLoans(
                savedLoan.getItem().getId(),
                savedLoan.getLender().getId(),
                savedLoan.getResponsible().getId(),
                twoMinutesAgo
        );

        // Si hay 2 o más préstamos duplicados (incluyendo el que acabamos de guardar)
        if (duplicateLoans.size() >= 2) {
            // Ordenar por fecha de préstamo descendente (más reciente primero)
            duplicateLoans.sort((l1, l2) -> {
                if (l1.getLendAt() == null && l2.getLendAt() == null) return 0;
                if (l1.getLendAt() == null) return 1;
                if (l2.getLendAt() == null) return -1;
                return l2.getLendAt().compareTo(l1.getLendAt());
            });

            // Mantener solo el más reciente, eliminar el resto
            for (int i = 1; i < duplicateLoans.size(); i++) {
                LoanEntity duplicateLoan = duplicateLoans.get(i);
                // Solo eliminar si no está devuelto (para evitar eliminar préstamos ya procesados)
                if (duplicateLoan.getReturned() == null || !duplicateLoan.getReturned()) {
                    loanRepository.delete(duplicateLoan);
                }
            }
        }
    }

    @Override
    public List<LoanResponse> getLoansByItemId(Long itemId) {
        itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        List<LoanEntity> loans = loanRepository.findAllByItemId(itemId);
        return loans.stream()
                .map(LoanMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<LoanResponse> getLastLoanByItemId(Long itemId) {
        itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        List<LoanEntity> loans = loanRepository.findLastLoanByItemId(itemId);
        return loans.stream()
                .findFirst()
                .map(LoanMapper::toDto);
    }

    @Override
    public List<LoanResponse> getMyLoans(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<LoanEntity> loans = loanRepository.findAllByResponsibleId(userId);
        return loans.stream()
                .map(LoanMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<LoanResponse> getLoansByLenderId(Long lenderId) {
        userRepository.findById(lenderId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<LoanEntity> loans = loanRepository.findAllByLenderId(lenderId);
        return loans.stream()
                .map(LoanMapper::toDto)
                .collect(Collectors.toList());
    }
}
