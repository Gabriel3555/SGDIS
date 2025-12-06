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
import com.sgdis.backend.cancellation.infrastructure.repository.SpringDataCancellationRepository;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
// Notificaciones
import com.sgdis.backend.notification.service.NotificationService;
import com.sgdis.backend.notification.service.NotificationPersistenceService;
import com.sgdis.backend.notification.dto.NotificationMessage;
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
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;
import com.sgdis.backend.utils.DateTimeUtils;

@Service
@RequiredArgsConstructor
public class LoanService implements LendItemUseCase, ReturnItemUseCase, GetLoansByItemUseCase, GetLastLoanByItemUseCase, GetMyLoansUseCase {

    private final AuthService authService;
    private final SpringDataLoanRepository loanRepository;
    private final SpringDataItemRepository itemRepository;
    private final SpringDataUserRepository userRepository;
    private final SpringDataCancellationRepository cancellationRepository;
    private final SpringDataInventoryRepository inventoryRepository;
    private final RecordActionUseCase recordActionUseCase;
    private final NotificationService notificationService;
    private final NotificationPersistenceService notificationPersistenceService;

    @Override
    @Transactional
    public LendItemResponse lendItem(LendItemRequest request) {
        UserEntity user = authService.getCurrentUser();

        ItemEntity item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        // Verificar que el item no esté dado de baja
        List<com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity> approvedCancellations = 
                cancellationRepository.findApprovedCancellationsByItemId(item.getId());
        if (approvedCancellations != null && !approvedCancellations.isEmpty()) {
            String itemName = item.getProductName() != null ? item.getProductName() : "Item ID " + item.getId();
            String plateNumber = item.getLicencePlateNumber() != null ? " (Placa: " + item.getLicencePlateNumber() + ")" : "";
            throw new IllegalStateException("No se puede prestar el item \"" + itemName + "\"" + plateNumber + " porque está dado de baja.");
        }

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

        // Enviar notificaciones
        sendItemLentNotifications(item, responsible, loanEntity);

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
        loanEntity.setReturnAt(DateTimeUtils.now());

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

        // Enviar notificaciones
        sendItemReturnedNotifications(itemEntity, loanEntity.getResponsible(), loanEntity);

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

    /**
     * Envía notificaciones cuando se presta un item.
     * Notifica al responsable de manera personalizada y a los usuarios relacionados con el inventario.
     */
    private void sendItemLentNotifications(ItemEntity item, UserEntity responsible, LoanEntity loan) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            InventoryEntity inventory = item.getInventory();
            if (inventory == null) {
                return;
            }
            
            // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
            InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                    .orElse(inventory);
            
            // Notificación personalizada para el responsable
            if (responsible != null && !responsible.getId().equals(currentUserId)) {
                String itemName = item.getProductName() != null ? item.getProductName() : "Item sin nombre";
                String inventoryName = fullInventory.getName() != null ? fullInventory.getName() : "Inventario sin nombre";
                String lenderName = currentUser.getFullName() != null ? currentUser.getFullName() : "Usuario";
                String personalMessage = String.format("Se te ha prestado el item '%s' del inventario '%s' por %s", 
                        itemName, inventoryName, lenderName);
                
                NotificationMessage personalNotification = new NotificationMessage(
                        "ITEM_LENT_PERSONAL",
                        "Item Prestado",
                        personalMessage,
                        new LoanNotificationData(loan.getId(), item.getId(), itemName, 
                                fullInventory.getId(), inventoryName, responsible.getId(), "LENT")
                );
                
                try {
                    notificationPersistenceService.saveNotification(
                            responsible.getId(),
                            "ITEM_LENT_PERSONAL",
                            "Item Prestado",
                            personalMessage,
                            new LoanNotificationData(loan.getId(), item.getId(), itemName, 
                                    fullInventory.getId(), inventoryName, responsible.getId(), "LENT")
                    );
                    notificationService.sendNotificationToUser(responsible.getId(), personalNotification);
                } catch (Exception e) {
                    // Log error pero continuar
                }
            }
            
            // Notificar a los usuarios relacionados con el inventario
            sendInventoryLoanNotifications(fullInventory, currentUserId, responsible != null ? responsible.getId() : null, 
                    item, loan, "LENT");
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }

    /**
     * Envía notificaciones cuando se devuelve un item.
     * Notifica al responsable de manera personalizada y a los usuarios relacionados con el inventario.
     */
    private void sendItemReturnedNotifications(ItemEntity item, UserEntity responsible, LoanEntity loan) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            InventoryEntity inventory = item.getInventory();
            if (inventory == null) {
                return;
            }
            
            // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
            InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                    .orElse(inventory);
            
            // Notificación personalizada para el responsable
            if (responsible != null && !responsible.getId().equals(currentUserId)) {
                String itemName = item.getProductName() != null ? item.getProductName() : "Item sin nombre";
                String inventoryName = fullInventory.getName() != null ? fullInventory.getName() : "Inventario sin nombre";
                String returnerName = currentUser.getFullName() != null ? currentUser.getFullName() : "Usuario";
                String personalMessage = String.format("Has devuelto el item '%s' del inventario '%s' a %s", 
                        itemName, inventoryName, returnerName);
                
                NotificationMessage personalNotification = new NotificationMessage(
                        "ITEM_RETURNED_PERSONAL",
                        "Item Devuelto",
                        personalMessage,
                        new LoanNotificationData(loan.getId(), item.getId(), itemName, 
                                fullInventory.getId(), inventoryName, responsible.getId(), "RETURNED")
                );
                
                try {
                    notificationPersistenceService.saveNotification(
                            responsible.getId(),
                            "ITEM_RETURNED_PERSONAL",
                            "Item Devuelto",
                            personalMessage,
                            new LoanNotificationData(loan.getId(), item.getId(), itemName, 
                                    fullInventory.getId(), inventoryName, responsible.getId(), "RETURNED")
                    );
                    notificationService.sendNotificationToUser(responsible.getId(), personalNotification);
                } catch (Exception e) {
                    // Log error pero continuar
                }
            }
            
            // Notificar a los usuarios relacionados con el inventario
            sendInventoryLoanNotifications(fullInventory, currentUserId, responsible != null ? responsible.getId() : null, 
                    item, loan, "RETURNED");
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }

    /**
     * Envía notificaciones informativas a los usuarios relacionados con el inventario cuando se presta o devuelve un item.
     * Se notifica a:
     * - El dueño del inventario
     * - Los firmantes del inventario
     * - Los manejadores del inventario
     * - Los warehouse del centro al cual pertenece el inventario
     * 
     * No se envía notificación al usuario que realiza la acción ni al responsable.
     */
    private void sendInventoryLoanNotifications(InventoryEntity inventory, Long currentUserId, Long responsibleId, 
                                                ItemEntity item, LoanEntity loan, String action) {
        try {
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Dueño del inventario
            if (inventory.getOwner() != null) {
                userIdsToNotify.add(inventory.getOwner().getId());
            }
            
            // 2. Firmantes del inventario - cargar usando consulta separada
            List<UserEntity> signatories = inventoryRepository.findSignatoriesByInventoryId(inventory.getId());
            signatories.forEach(signatory -> {
                if (signatory != null && signatory.isStatus()) {
                    userIdsToNotify.add(signatory.getId());
                }
            });
            
            // 3. Manejadores del inventario - cargar usando consulta separada
            List<UserEntity> managers = inventoryRepository.findManagersByInventoryId(inventory.getId());
            managers.forEach(manager -> {
                if (manager != null && manager.isStatus()) {
                    userIdsToNotify.add(manager.getId());
                }
            });
            
            // 4. Warehouse del centro al cual pertenece el inventario
            if (inventory.getInstitution() != null) {
                Long institutionId = inventory.getInstitution().getId();
                
                List<UserEntity> warehouses = userRepository.findByInstitutionIdAndRole(institutionId, Role.WAREHOUSE);
                warehouses.forEach(warehouse -> userIdsToNotify.add(warehouse.getId()));
            }
            
            // Remover al usuario actual y al responsable de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            if (responsibleId != null) {
                userIdsToNotify.remove(responsibleId);
            }
            
            // Preparar datos de la notificación
            String itemName = item.getProductName() != null ? item.getProductName() : "Item sin nombre";
            String inventoryName = inventory.getName() != null ? inventory.getName() : "Inventario sin nombre";
            String responsibleName = loan.getResponsible() != null && loan.getResponsible().getFullName() != null
                    ? loan.getResponsible().getFullName()
                    : "Usuario";
            
            String message;
            String notificationType;
            String notificationTitle;
            
            if (action.equals("LENT")) {
                message = String.format("Se ha prestado el item '%s' del inventario '%s' a %s", 
                        itemName, inventoryName, responsibleName);
                notificationType = "ITEM_LENT";
                notificationTitle = "Item Prestado";
            } else {
                message = String.format("Se ha devuelto el item '%s' del inventario '%s' por %s", 
                        itemName, inventoryName, responsibleName);
                notificationType = "ITEM_RETURNED";
                notificationTitle = "Item Devuelto";
            }
            
            NotificationMessage notification = new NotificationMessage(
                    notificationType,
                    notificationTitle,
                    message,
                    new LoanNotificationData(loan.getId(), item.getId(), itemName, 
                            inventory.getId(), inventoryName, responsibleId, action)
            );
            
            // Enviar notificaciones a todos los usuarios
            for (Long userId : userIdsToNotify) {
                try {
                    notificationPersistenceService.saveNotification(
                            userId,
                            notificationType,
                            notificationTitle,
                            message,
                            new LoanNotificationData(loan.getId(), item.getId(), itemName, 
                                    inventory.getId(), inventoryName, responsibleId, action)
                    );
                    notificationService.sendNotificationToUser(userId, notification);
                } catch (Exception e) {
                    // Log error pero continuar con otros usuarios
                }
            }
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }
    
    /**
     * DTO interno para datos de préstamo en la notificación
     */
    private record LoanNotificationData(
            Long loanId,
            Long itemId,
            String itemName,
            Long inventoryId,
            String inventoryName,
            Long responsibleId,
            String action
    ) {}
}
