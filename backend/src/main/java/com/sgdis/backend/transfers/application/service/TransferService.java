package com.sgdis.backend.transfers.application.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.exception.DomainValidationException;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import com.sgdis.backend.transfers.application.dto.ApproveTransferRequest;
import com.sgdis.backend.transfers.application.dto.ApproveTransferResponse;
import com.sgdis.backend.transfers.application.dto.RejectTransferRequest;
import com.sgdis.backend.transfers.application.dto.RejectTransferResponse;
import com.sgdis.backend.transfers.application.dto.RequestTransferRequest;
import com.sgdis.backend.transfers.application.dto.RequestTransferResponse;
import com.sgdis.backend.transfers.application.dto.TransferSummaryResponse;
import com.sgdis.backend.transfers.application.dto.TransferStatisticsResponse;
import com.sgdis.backend.transfers.application.port.in.ApproveTransferUseCase;
import com.sgdis.backend.transfers.application.port.in.RejectTransferUseCase;
import com.sgdis.backend.transfers.application.port.in.GetAllTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.GetInventoryTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.GetItemTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.GetRegionalTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.GetTransferStatisticsUseCase;
import com.sgdis.backend.transfers.application.port.in.RequestTransferUseCase;
import com.sgdis.backend.transfers.domain.TransferStatus;
import com.sgdis.backend.transfers.infrastructure.entity.TransferEntity;
import com.sgdis.backend.transfers.infrastructure.repository.SpringDataTransferRepository;
import com.sgdis.backend.transfers.mapper.TransferMapper;
import com.sgdis.backend.cancellation.infrastructure.repository.SpringDataCancellationRepository;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
// Notificaciones
import com.sgdis.backend.notification.service.NotificationService;
import com.sgdis.backend.notification.service.NotificationPersistenceService;
import com.sgdis.backend.notification.dto.NotificationMessage;
// Auditoría
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransferService implements ApproveTransferUseCase, RejectTransferUseCase, RequestTransferUseCase, GetInventoryTransfersUseCase,
        GetItemTransfersUseCase, GetAllTransfersUseCase, GetRegionalTransfersUseCase, GetTransferStatisticsUseCase {

    private final AuthService authService;
    private final SpringDataTransferRepository transferRepository;
    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;
    private final SpringDataCancellationRepository cancellationRepository;
    private final RecordActionUseCase recordActionUseCase;
    private final NotificationService notificationService;
    private final NotificationPersistenceService notificationPersistenceService;
    private final SpringDataUserRepository userRepository;

    @Override
    @Transactional
    public RequestTransferResponse requestTransfer(RequestTransferRequest request) {
        if (request == null) {
            throw new DomainValidationException("La solicitud de transferencia es obligatoria");
        }

        ItemEntity item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item no encontrado con id: " + request.itemId()));

        // Verificar que el item no esté dado de baja
        List<com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity> approvedCancellations = 
                cancellationRepository.findApprovedCancellationsByItemId(item.getId());
        if (approvedCancellations != null && !approvedCancellations.isEmpty()) {
            String itemName = item.getProductName() != null ? item.getProductName() : "Item ID " + item.getId();
            String plateNumber = item.getLicencePlateNumber() != null ? " (Placa: " + item.getLicencePlateNumber() + ")" : "";
            throw new DomainValidationException("No se puede transferir el item \"" + itemName + "\"" + plateNumber + " porque está dado de baja.");
        }

        InventoryEntity sourceInventory = item.getInventory();
        if (sourceInventory == null) {
            throw new DomainValidationException("El ítem no pertenece a ningún inventario");
        }

        InventoryEntity destinationInventory = inventoryRepository.findById(request.destinationInventoryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inventario no encontrado con id: " + request.destinationInventoryId()));

        if (sourceInventory.getId().equals(destinationInventory.getId())) {
            throw new DomainValidationException("El inventario de destino debe ser diferente al actual");
        }

        // Validate that both inventories belong to the same institution
        if (sourceInventory.getInstitution() == null || destinationInventory.getInstitution() == null) {
            throw new DomainValidationException("Ambos inventarios deben pertenecer a una institución para realizar la transferencia");
        }

        if (!sourceInventory.getInstitution().getId().equals(destinationInventory.getInstitution().getId())) {
            String sourceInstitutionName = sourceInventory.getInstitution().getName() != null 
                ? sourceInventory.getInstitution().getName() 
                : "sin nombre";
            String destinationInstitutionName = destinationInventory.getInstitution().getName() != null 
                ? destinationInventory.getInstitution().getName() 
                : "sin nombre";
            throw new DomainValidationException(
                String.format("Los inventarios deben pertenecer al mismo centro. Inventario origen: %s, Inventario destino: %s", 
                    sourceInstitutionName, destinationInstitutionName)
            );
        }

        if (transferRepository.existsByItemIdAndStatus(item.getId(), TransferStatus.PENDING)) {
            throw new DomainValidationException("Ya existe una transferencia pendiente para este ítem");
        }

        UserEntity requester = authService.getCurrentUser();
        
        // Para usuarios USER, verificar que NO sea manager del inventario origen
        if (requester.getRole() == Role.USER) {
            if (sourceInventory.getManagers() != null && sourceInventory.getManagers().contains(requester)) {
                String inventoryName = sourceInventory.getName() != null ? sourceInventory.getName() : "Inventario ID " + sourceInventory.getId();
                throw new DomainValidationException(
                        String.format("Los manejadores no pueden solicitar transferencias de items. Solo los propietarios y firmantes pueden solicitar transferencias. Inventario: %s",
                                inventoryName)
                );
            }
        }
        
        if (!belongsToInventory(requester, sourceInventory) && !hasTransferPrivilegedRole(requester)) {
            throw new DomainValidationException("No cuentas con permisos para solicitar la transferencia de este ítem");
        }

        // Additional validation for WAREHOUSE role
        if (requester.getRole() == Role.WAREHOUSE) {
            // Warehouse can only transfer items from their institution
            if (requester.getInstitution() == null) {
                throw new DomainValidationException("El usuario warehouse no tiene una institución asignada");
            }
            
            if (sourceInventory.getInstitution() == null || 
                !sourceInventory.getInstitution().getId().equals(requester.getInstitution().getId())) {
                throw new DomainValidationException("Solo puedes transferir items que pertenecen a tu institución");
            }
            
            // Warehouse can only transfer to inventories in their regional
            if (requester.getInstitution().getRegional() == null) {
                throw new DomainValidationException("La institución del usuario warehouse no tiene una regional asignada");
            }
            
            if (destinationInventory.getInstitution() == null || 
                destinationInventory.getInstitution().getRegional() == null) {
                throw new DomainValidationException("El inventario de destino no tiene una regional asignada");
            }
            
            if (!destinationInventory.getInstitution().getRegional().getId()
                    .equals(requester.getInstitution().getRegional().getId())) {
                throw new DomainValidationException("Solo puedes transferir a inventarios de tu regional");
            }
        }

        // Check if user has privileged role for direct transfer
        boolean isDirectTransfer = hasTransferPrivilegedRole(requester);

        TransferEntity transfer = TransferEntity.builder()
                .details(request.details() != null ? request.details().trim() : null)
                .item(item)
                .inventory(destinationInventory)
                .sourceInventory(sourceInventory)
                .requestedBy(requester)
                .approvalStatus(isDirectTransfer ? TransferStatus.APPROVED : TransferStatus.PENDING)
                .status(true)
                .build();

        // If direct transfer, move the item immediately
        if (isDirectTransfer) {
            item.setInventory(destinationInventory);
            if (destinationInventory.getLocation() != null) {
                item.setLocation(destinationInventory.getLocation());
            }
            itemRepository.save(item);
            
            // Actualizar totalPrice de ambos inventarios
            updateInventoryTotalPrices(sourceInventory.getId(), destinationInventory.getId(), item.getAcquisitionValue());
            
            transfer.setApprovedAt(LocalDateTime.now());
            transfer.setApprovedBy(requester);
            transfer.setApprovalNotes("Transferencia directa por " + requester.getRole().name());
        }

        TransferEntity saved = transferRepository.save(transfer);
        
        // Registrar auditoría
        String itemName = item.getProductName() != null ? item.getProductName() : "sin nombre";
        String sourceInventoryName = sourceInventory.getName() != null ? sourceInventory.getName() : "sin nombre";
        String destinationInventoryName = destinationInventory.getName() != null ? destinationInventory.getName() : "sin nombre";
        String transferType = isDirectTransfer ? "Transferencia directa" : "Solicitud de transferencia";
        
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("%s: Item %s (ID: %d) - De: %s (ID: %d) → A: %s (ID: %d) - Solicitado por: %s (%s)", 
                        transferType,
                        itemName,
                        item.getId(),
                        sourceInventoryName,
                        sourceInventory.getId(),
                        destinationInventoryName,
                        destinationInventory.getId(),
                        requester.getFullName(),
                        requester.getEmail())
        ));
        
        // Enviar notificaciones
        if (isDirectTransfer) {
            // Si es transferencia directa, notificar como aprobada
            sendTransferApprovedNotifications(saved);
        } else {
            // Si es solicitud, notificar como solicitada
            sendTransferRequestedNotifications(saved);
        }
        
        return TransferMapper.toRequestResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransferSummaryResponse> getTransfersByInventory(Long inventoryId) {
        if (inventoryId == null) {
            throw new DomainValidationException("El id de inventario es obligatorio");
        }

        InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado con id: " + inventoryId));

        UserEntity currentUser = authService.getCurrentUser();
        if (!belongsToInventory(currentUser, inventory) && !hasTransferPrivilegedRole(currentUser)) {
            throw new DomainValidationException("No cuentas con permisos para consultar este inventario");
        }

        return transferRepository.findAllByInventory(inventoryId)
                .stream()
                .map(TransferMapper::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ApproveTransferResponse approveTransfer(Long transferId, ApproveTransferRequest request) {
        TransferEntity transfer = transferRepository.findByIdWithRelations(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found with id: " + transferId));

        if (transfer.getApprovalStatus() == TransferStatus.APPROVED) {
            throw new DomainValidationException("La transferencia ya fue aprobada");
        }

        if (transfer.getApprovalStatus() == TransferStatus.REJECTED) {
            throw new DomainValidationException("La transferencia ya fue rechazada");
        }

        ItemEntity item = transfer.getItem();
        if (item == null) {
            throw new DomainValidationException("La transferencia no tiene un ítem asociado");
        }

        // Verificar que el item no esté dado de baja
        List<com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity> approvedCancellations = 
                cancellationRepository.findApprovedCancellationsByItemId(item.getId());
        if (approvedCancellations != null && !approvedCancellations.isEmpty()) {
            String itemName = item.getProductName() != null ? item.getProductName() : "Item ID " + item.getId();
            String plateNumber = item.getLicencePlateNumber() != null ? " (Placa: " + item.getLicencePlateNumber() + ")" : "";
            throw new DomainValidationException("No se puede aprobar la transferencia del item \"" + itemName + "\"" + plateNumber + " porque está dado de baja.");
        }

        InventoryEntity destinationInventory = transfer.getInventory();
        if (destinationInventory == null) {
            throw new DomainValidationException("La transferencia no tiene un inventario de destino asignado");
        }

        InventoryEntity sourceInventory = transfer.getSourceInventory();
        if (sourceInventory == null) {
            sourceInventory = item.getInventory();
        }
        if (sourceInventory == null) {
            throw new DomainValidationException("El ítem no pertenece a ningún inventario");
        }

        UserEntity approver = authService.getCurrentUser();
        if (!isAuthorizedToApprove(approver, sourceInventory, destinationInventory)
                && !hasTransferPrivilegedRole(approver)) {
            throw new DomainValidationException("No cuentas con permisos para aprobar esta transferencia");
        }

        item.setInventory(destinationInventory);
        if (destinationInventory.getLocation() != null) {
            item.setLocation(destinationInventory.getLocation());
        }
        itemRepository.save(item);

        // Actualizar totalPrice de ambos inventarios
        updateInventoryTotalPrices(sourceInventory.getId(), destinationInventory.getId(), item.getAcquisitionValue());

        transfer.setSourceInventory(sourceInventory);
        transfer.setApprovalStatus(TransferStatus.APPROVED);
        transfer.setApprovedAt(LocalDateTime.now());
        transfer.setApprovedBy(approver);
        if (request != null && request.approvalNotes() != null && !request.approvalNotes().isBlank()) {
            transfer.setApprovalNotes(request.approvalNotes().trim());
        }
        transferRepository.save(transfer);

        // Registrar auditoría
        String itemName = item.getProductName() != null ? item.getProductName() : "sin nombre";
        String sourceInventoryName = sourceInventory.getName() != null ? sourceInventory.getName() : "sin nombre";
        String destinationInventoryName = destinationInventory.getName() != null ? destinationInventory.getName() : "sin nombre";
        String requesterName = transfer.getRequestedBy() != null ? transfer.getRequestedBy().getFullName() : "N/A";
        
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Transferencia aprobada: Item %s (ID: %d) - De: %s (ID: %d) → A: %s (ID: %d) - Aprobado por: %s (%s) - Solicitado por: %s", 
                        itemName,
                        item.getId(),
                        sourceInventoryName,
                        sourceInventory.getId(),
                        destinationInventoryName,
                        destinationInventory.getId(),
                        approver.getFullName(),
                        approver.getEmail(),
                        requesterName)
        ));

        // Enviar notificaciones
        sendTransferApprovedNotifications(transfer);

        return TransferMapper.toApproveResponse(transfer);
    }

    @Override
    @Transactional
    public RejectTransferResponse rejectTransfer(Long transferId, RejectTransferRequest request) {
        TransferEntity transfer = transferRepository.findByIdWithRelations(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found with id: " + transferId));

        if (transfer.getApprovalStatus() == TransferStatus.APPROVED) {
            throw new DomainValidationException("La transferencia ya fue aprobada");
        }

        if (transfer.getApprovalStatus() == TransferStatus.REJECTED) {
            throw new DomainValidationException("La transferencia ya fue rechazada");
        }

        ItemEntity item = transfer.getItem();
        if (item == null) {
            throw new DomainValidationException("La transferencia no tiene un ítem asociado");
        }

        InventoryEntity destinationInventory = transfer.getInventory();
        if (destinationInventory == null) {
            throw new DomainValidationException("La transferencia no tiene un inventario de destino asignado");
        }

        InventoryEntity sourceInventory = transfer.getSourceInventory();
        if (sourceInventory == null) {
            sourceInventory = item.getInventory();
        }
        if (sourceInventory == null) {
            throw new DomainValidationException("El ítem no pertenece a ningún inventario");
        }

        UserEntity rejecter = authService.getCurrentUser();
        if (!isAuthorizedToApprove(rejecter, sourceInventory, destinationInventory)
                && !hasTransferPrivilegedRole(rejecter)) {
            throw new DomainValidationException("No cuentas con permisos para rechazar esta transferencia");
        }

        // No movemos el item ni actualizamos precios, solo marcamos como rechazada
        transfer.setSourceInventory(sourceInventory);
        transfer.setApprovalStatus(TransferStatus.REJECTED);
        transfer.setRejectedAt(LocalDateTime.now());
        transfer.setRejectedBy(rejecter);
        if (request != null && request.rejectionNotes() != null && !request.rejectionNotes().isBlank()) {
            transfer.setRejectionNotes(request.rejectionNotes().trim());
        }
        transferRepository.save(transfer);

        // Registrar auditoría
        String itemName = item.getProductName() != null ? item.getProductName() : "sin nombre";
        String sourceInventoryName = sourceInventory.getName() != null ? sourceInventory.getName() : "sin nombre";
        String destinationInventoryName = destinationInventory.getName() != null ? destinationInventory.getName() : "sin nombre";
        String requesterName = transfer.getRequestedBy() != null ? transfer.getRequestedBy().getFullName() : "N/A";
        
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Transferencia rechazada: Item %s (ID: %d) - De: %s (ID: %d) → A: %s (ID: %d) - Rechazado por: %s (%s) - Solicitado por: %s", 
                        itemName,
                        item.getId(),
                        sourceInventoryName,
                        sourceInventory.getId(),
                        destinationInventoryName,
                        destinationInventory.getId(),
                        rejecter.getFullName(),
                        rejecter.getEmail(),
                        requesterName)
        ));

        // Enviar notificaciones
        sendTransferRejectedNotifications(transfer);

        return TransferMapper.toRejectResponse(transfer);
    }

    private boolean isAuthorizedToApprove(UserEntity user, InventoryEntity sourceInventory,
            InventoryEntity destinationInventory) {
        return belongsToInventory(user, sourceInventory) || belongsToInventory(user, destinationInventory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransferSummaryResponse> getTransfersByItemId(Long itemId) {
        if (itemId == null) {
            throw new DomainValidationException("El id del item es obligatorio");
        }

        ItemEntity item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item no encontrado con id: " + itemId));

        UserEntity currentUser = authService.getCurrentUser();
        InventoryEntity itemInventory = item.getInventory();

        // Check if user has permission to view transfers for this item
        if (itemInventory != null && !belongsToInventory(currentUser, itemInventory)
                && !hasTransferPrivilegedRole(currentUser)) {
            throw new DomainValidationException(
                    "No cuentas con permisos para consultar las transferencias de este item");
        }

        return transferRepository.findAllByItemId(itemId)
                .stream()
                .map(TransferMapper::toSummaryResponse)
                .collect(Collectors.toList());
    }

    private boolean belongsToInventory(UserEntity user, InventoryEntity inventory) {
        if (user == null || inventory == null) {
            return false;
        }

        if (inventory.getOwner() != null && inventory.getOwner().getId().equals(user.getId())) {
            return true;
        }

        if (inventory.getManagers() != null &&
                inventory.getManagers().stream().anyMatch(manager -> manager.getId().equals(user.getId()))) {
            return true;
        }

        return inventory.getSignatories() != null &&
                inventory.getSignatories().stream().anyMatch(signatory -> signatory.getId().equals(user.getId()));
    }

    /**
     * Checks if the user has a role that allows direct transfer operations
     * Roles allowed: SUPERADMIN, ADMIN_INSTITUTION, ADMIN_REGIONAL, WAREHOUSE
     */
    private boolean hasTransferPrivilegedRole(UserEntity user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        return user.getRole() == Role.SUPERADMIN ||
               user.getRole() == Role.ADMIN_INSTITUTION ||
               user.getRole() == Role.ADMIN_REGIONAL ||
               user.getRole() == Role.WAREHOUSE;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransferSummaryResponse> getAllTransfers(Pageable pageable) {
        // Obtener el total de transferencias
        Long totalElements = transferRepository.countAllTransfers();
        
        // Cargar todas las transferencias con relaciones (sin paginación en la query)
        List<TransferEntity> allTransfers = transferRepository.findAllOrderedByRequestedAtWithRelations();
        
        // Aplicar paginación manualmente
        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int start = page * size;
        int end = Math.min(start + size, allTransfers.size());
        
        List<TransferEntity> paginatedTransfers = start < allTransfers.size() 
            ? allTransfers.subList(start, end)
            : new java.util.ArrayList<>();
        
        // Convertir a DTOs
        List<TransferSummaryResponse> content = paginatedTransfers.stream()
                .map(TransferMapper::toSummaryResponse)
                .collect(Collectors.toList());
        
        // Crear Page con el contenido y la información de paginación
        return new org.springframework.data.domain.PageImpl<>(
                content,
                pageable,
                totalElements
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransferSummaryResponse> getTransfersByRegional(Long regionalId, Pageable pageable) {
        if (regionalId == null) {
            throw new DomainValidationException("El id de la regional es obligatorio");
        }

        // Obtener transferencias paginadas por regional
        Page<TransferEntity> transferPage = transferRepository.findAllByRegionalId(regionalId, pageable);
        
        // Convertir a DTOs
        List<TransferSummaryResponse> content = transferPage.getContent().stream()
                .map(TransferMapper::toSummaryResponse)
                .collect(Collectors.toList());
        
        // Retornar página con el contenido
        return new org.springframework.data.domain.PageImpl<>(
                content,
                pageable,
                transferPage.getTotalElements()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public TransferStatisticsResponse getTransferStatistics() {
        Long total = transferRepository.countAllTransfers();
        Long pending = transferRepository.countByStatus(TransferStatus.PENDING);
        Long approved = transferRepository.countByStatus(TransferStatus.APPROVED);
        Long rejected = transferRepository.countByStatus(TransferStatus.REJECTED);
        
        return new TransferStatisticsResponse(total, pending, approved, rejected);
    }

    /**
     * Actualiza el totalPrice de los inventarios origen y destino durante una transferencia.
     * Resta el valor del inventario origen y lo suma al inventario destino.
     * Usa queries directas a la base de datos para evitar problemas con el caché de Hibernate.
     * 
     * @param sourceInventoryId ID del inventario de origen (se resta el valor)
     * @param destinationInventoryId ID del inventario de destino (se suma el valor)
     * @param itemValue Valor del item a transferir (acquisitionValue)
     */
    private void updateInventoryTotalPrices(Long sourceInventoryId, 
                                            Long destinationInventoryId, 
                                            Double itemValue) {
        if (itemValue != null && itemValue > 0) {
            // Restar del inventario origen usando query directa
            inventoryRepository.subtractFromTotalPrice(sourceInventoryId, itemValue);
            
            // Sumar al inventario destino usando query directa
            inventoryRepository.addToTotalPrice(destinationInventoryId, itemValue);
        }
    }

    /**
     * Envía notificaciones cuando se solicita una transferencia.
     * Se notifica a los usuarios relacionados con ambos inventarios (origen y destino).
     */
    private void sendTransferRequestedNotifications(TransferEntity transfer) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            InventoryEntity sourceInventory = transfer.getSourceInventory();
            InventoryEntity destinationInventory = transfer.getInventory();
            ItemEntity item = transfer.getItem();
            
            if (sourceInventory == null || destinationInventory == null || item == null) {
                return;
            }
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin (solo una vez)
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // Obtener usuarios relacionados con el inventario origen
            addInventoryRelatedUsers(userIdsToNotify, sourceInventory);
            
            // Obtener usuarios relacionados con el inventario destino
            addInventoryRelatedUsers(userIdsToNotify, destinationInventory);
            
            // Remover al usuario actual y al solicitante de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            if (transfer.getRequestedBy() != null) {
                userIdsToNotify.remove(transfer.getRequestedBy().getId());
            }
            
            // Preparar datos de la notificación
            String itemName = item.getProductName() != null ? item.getProductName() : "Item sin nombre";
            String sourceInventoryName = sourceInventory.getName() != null ? sourceInventory.getName() : "Inventario origen";
            String destinationInventoryName = destinationInventory.getName() != null ? destinationInventory.getName() : "Inventario destino";
            String requesterName = transfer.getRequestedBy() != null && transfer.getRequestedBy().getFullName() != null
                    ? transfer.getRequestedBy().getFullName()
                    : "Usuario";
            String message = String.format("Se ha solicitado una transferencia del item '%s' de '%s' a '%s' por %s", 
                    itemName, sourceInventoryName, destinationInventoryName, requesterName);
            
            NotificationMessage notification = new NotificationMessage(
                    "TRANSFER_REQUESTED",
                    "Transferencia Solicitada",
                    message,
                    new TransferNotificationData(transfer.getId(), item.getId(), itemName, 
                            sourceInventory.getId(), sourceInventoryName,
                            destinationInventory.getId(), destinationInventoryName, "REQUESTED")
            );
            
            // Enviar notificaciones a todos los usuarios
            sendNotificationsToUsers(userIdsToNotify, notification, "TRANSFER_REQUESTED", "Transferencia Solicitada", message,
                    new TransferNotificationData(transfer.getId(), item.getId(), itemName, 
                            sourceInventory.getId(), sourceInventoryName,
                            destinationInventory.getId(), destinationInventoryName, "REQUESTED"));
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }

    /**
     * Envía notificaciones cuando se aprueba una transferencia.
     */
    private void sendTransferApprovedNotifications(TransferEntity transfer) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            InventoryEntity sourceInventory = transfer.getSourceInventory();
            InventoryEntity destinationInventory = transfer.getInventory();
            ItemEntity item = transfer.getItem();
            
            if (sourceInventory == null || destinationInventory == null || item == null) {
                return;
            }
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin (solo una vez)
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // Obtener usuarios relacionados con el inventario origen
            addInventoryRelatedUsers(userIdsToNotify, sourceInventory);
            
            // Obtener usuarios relacionados con el inventario destino
            addInventoryRelatedUsers(userIdsToNotify, destinationInventory);
            
            // Remover al usuario actual de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            
            // Preparar datos de la notificación
            String itemName = item.getProductName() != null ? item.getProductName() : "Item sin nombre";
            String sourceInventoryName = sourceInventory.getName() != null ? sourceInventory.getName() : "Inventario origen";
            String destinationInventoryName = destinationInventory.getName() != null ? destinationInventory.getName() : "Inventario destino";
            String approverName = transfer.getApprovedBy() != null && transfer.getApprovedBy().getFullName() != null
                    ? transfer.getApprovedBy().getFullName()
                    : "Usuario";
            String requesterName = transfer.getRequestedBy() != null && transfer.getRequestedBy().getFullName() != null
                    ? transfer.getRequestedBy().getFullName()
                    : "Usuario";
            
            // Notificación personalizada para el solicitante
            if (transfer.getRequestedBy() != null && !transfer.getRequestedBy().getId().equals(currentUserId)) {
                String personalMessage = String.format("Tu solicitud de transferencia del item '%s' de '%s' a '%s' ha sido aprobada por %s", 
                        itemName, sourceInventoryName, destinationInventoryName, approverName);
                
                NotificationMessage personalNotification = new NotificationMessage(
                        "TRANSFER_APPROVED_PERSONAL",
                        "Tu Transferencia fue Aprobada",
                        personalMessage,
                        new TransferNotificationData(transfer.getId(), item.getId(), itemName, 
                                sourceInventory.getId(), sourceInventoryName,
                                destinationInventory.getId(), destinationInventoryName, "APPROVED")
                );
                
                try {
                    notificationPersistenceService.saveNotification(
                            transfer.getRequestedBy().getId(),
                            "TRANSFER_APPROVED_PERSONAL",
                            "Tu Transferencia fue Aprobada",
                            personalMessage,
                            new TransferNotificationData(transfer.getId(), item.getId(), itemName, 
                                    sourceInventory.getId(), sourceInventoryName,
                                    destinationInventory.getId(), destinationInventoryName, "APPROVED")
                    );
                    notificationService.sendNotificationToUser(transfer.getRequestedBy().getId(), personalNotification);
                } catch (Exception e) {
                    // Log error pero continuar
                }
            }
            
            // Notificación informativa para los demás usuarios
            String message = String.format("Se ha aprobado una transferencia del item '%s' de '%s' a '%s' por %s (Solicitado por: %s)", 
                    itemName, sourceInventoryName, destinationInventoryName, approverName, requesterName);
            
            NotificationMessage notification = new NotificationMessage(
                    "TRANSFER_APPROVED",
                    "Transferencia Aprobada",
                    message,
                    new TransferNotificationData(transfer.getId(), item.getId(), itemName, 
                            sourceInventory.getId(), sourceInventoryName,
                            destinationInventory.getId(), destinationInventoryName, "APPROVED")
            );
            
            // Enviar notificaciones a todos los usuarios (excluyendo al solicitante que ya recibió su notificación personalizada)
            if (transfer.getRequestedBy() != null) {
                userIdsToNotify.remove(transfer.getRequestedBy().getId());
            }
            sendNotificationsToUsers(userIdsToNotify, notification, "TRANSFER_APPROVED", "Transferencia Aprobada", message,
                    new TransferNotificationData(transfer.getId(), item.getId(), itemName, 
                            sourceInventory.getId(), sourceInventoryName,
                            destinationInventory.getId(), destinationInventoryName, "APPROVED"));
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }

    /**
     * Envía notificaciones cuando se rechaza una transferencia.
     */
    private void sendTransferRejectedNotifications(TransferEntity transfer) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            InventoryEntity sourceInventory = transfer.getSourceInventory();
            InventoryEntity destinationInventory = transfer.getInventory();
            ItemEntity item = transfer.getItem();
            
            if (sourceInventory == null || destinationInventory == null || item == null) {
                return;
            }
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin (solo una vez)
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // Obtener usuarios relacionados con el inventario origen
            addInventoryRelatedUsers(userIdsToNotify, sourceInventory);
            
            // Obtener usuarios relacionados con el inventario destino
            addInventoryRelatedUsers(userIdsToNotify, destinationInventory);
            
            // Remover al usuario actual de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            
            // Preparar datos de la notificación
            String itemName = item.getProductName() != null ? item.getProductName() : "Item sin nombre";
            String sourceInventoryName = sourceInventory.getName() != null ? sourceInventory.getName() : "Inventario origen";
            String destinationInventoryName = destinationInventory.getName() != null ? destinationInventory.getName() : "Inventario destino";
            String rejecterName = transfer.getRejectedBy() != null && transfer.getRejectedBy().getFullName() != null
                    ? transfer.getRejectedBy().getFullName()
                    : "Usuario";
            String requesterName = transfer.getRequestedBy() != null && transfer.getRequestedBy().getFullName() != null
                    ? transfer.getRequestedBy().getFullName()
                    : "Usuario";
            
            // Notificación personalizada para el solicitante
            if (transfer.getRequestedBy() != null && !transfer.getRequestedBy().getId().equals(currentUserId)) {
                String rejectionNotes = transfer.getRejectionNotes() != null && !transfer.getRejectionNotes().trim().isEmpty()
                        ? transfer.getRejectionNotes()
                        : null;
                
                String personalMessage = rejectionNotes != null
                        ? String.format("Tu solicitud de transferencia del item '%s' de '%s' a '%s' ha sido rechazada por %s. Motivo: %s", 
                                itemName, sourceInventoryName, destinationInventoryName, rejecterName, rejectionNotes)
                        : String.format("Tu solicitud de transferencia del item '%s' de '%s' a '%s' ha sido rechazada por %s", 
                                itemName, sourceInventoryName, destinationInventoryName, rejecterName);
                
                NotificationMessage personalNotification = new NotificationMessage(
                        "TRANSFER_REJECTED_PERSONAL",
                        "Tu Transferencia fue Rechazada",
                        personalMessage,
                        new TransferNotificationData(transfer.getId(), item.getId(), itemName, 
                                sourceInventory.getId(), sourceInventoryName,
                                destinationInventory.getId(), destinationInventoryName, "REJECTED")
                );
                
                try {
                    notificationPersistenceService.saveNotification(
                            transfer.getRequestedBy().getId(),
                            "TRANSFER_REJECTED_PERSONAL",
                            "Tu Transferencia fue Rechazada",
                            personalMessage,
                            new TransferNotificationData(transfer.getId(), item.getId(), itemName, 
                                    sourceInventory.getId(), sourceInventoryName,
                                    destinationInventory.getId(), destinationInventoryName, "REJECTED")
                    );
                    notificationService.sendNotificationToUser(transfer.getRequestedBy().getId(), personalNotification);
                } catch (Exception e) {
                    // Log error pero continuar
                }
            }
            
            // Notificación informativa para los demás usuarios
            String message = String.format("Se ha rechazado una transferencia del item '%s' de '%s' a '%s' por %s (Solicitado por: %s)", 
                    itemName, sourceInventoryName, destinationInventoryName, rejecterName, requesterName);
            
            NotificationMessage notification = new NotificationMessage(
                    "TRANSFER_REJECTED",
                    "Transferencia Rechazada",
                    message,
                    new TransferNotificationData(transfer.getId(), item.getId(), itemName, 
                            sourceInventory.getId(), sourceInventoryName,
                            destinationInventory.getId(), destinationInventoryName, "REJECTED")
            );
            
            // Enviar notificaciones a todos los usuarios (excluyendo al solicitante que ya recibió su notificación personalizada)
            if (transfer.getRequestedBy() != null) {
                userIdsToNotify.remove(transfer.getRequestedBy().getId());
            }
            sendNotificationsToUsers(userIdsToNotify, notification, "TRANSFER_REJECTED", "Transferencia Rechazada", message,
                    new TransferNotificationData(transfer.getId(), item.getId(), itemName, 
                            sourceInventory.getId(), sourceInventoryName,
                            destinationInventory.getId(), destinationInventoryName, "REJECTED"));
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }

    /**
     * Agrega los usuarios relacionados con un inventario al conjunto de usuarios a notificar.
     */
    private void addInventoryRelatedUsers(Set<Long> userIdsToNotify, InventoryEntity inventory) {
        // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
        InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                .orElse(inventory);
        
        // 2. Admin regional de la misma regional del inventario
        if (fullInventory.getInstitution() != null && 
            fullInventory.getInstitution().getRegional() != null) {
            Long regionalId = fullInventory.getInstitution().getRegional().getId();
            
            List<UserEntity> adminRegionals = userRepository.findByRoleAndRegionalId(Role.ADMIN_REGIONAL, regionalId);
            adminRegionals.forEach(admin -> userIdsToNotify.add(admin.getId()));
        }
        
        // 3. Admin institution y warehouse de la misma institution del inventario
        if (fullInventory.getInstitution() != null) {
            Long institutionId = fullInventory.getInstitution().getId();
            
            List<UserEntity> institutionUsers = userRepository.findByInstitutionIdAndRoles(
                    institutionId, Role.ADMIN_INSTITUTION, Role.WAREHOUSE);
            institutionUsers.forEach(user -> userIdsToNotify.add(user.getId()));
        }
        
        // 4. Dueño del inventario
        if (fullInventory.getOwner() != null) {
            userIdsToNotify.add(fullInventory.getOwner().getId());
        }
        
        // 5. Firmadores del inventario - cargar usando consulta separada
        List<UserEntity> signatories = inventoryRepository.findSignatoriesByInventoryId(inventory.getId());
        signatories.forEach(signatory -> {
            if (signatory != null && signatory.isStatus()) {
                userIdsToNotify.add(signatory.getId());
            }
        });
        
        // 6. Manejadores del inventario - cargar usando consulta separada
        List<UserEntity> managers = inventoryRepository.findManagersByInventoryId(inventory.getId());
        managers.forEach(manager -> {
            if (manager != null && manager.isStatus()) {
                userIdsToNotify.add(manager.getId());
            }
        });
    }

    /**
     * Envía notificaciones a una lista de usuarios.
     */
    private void sendNotificationsToUsers(Set<Long> userIdsToNotify, NotificationMessage notification, 
                                         String type, String title, String message, Object data) {
        for (Long userId : userIdsToNotify) {
            try {
                // Guardar en base de datos
                notificationPersistenceService.saveNotification(userId, type, title, message, data);
                
                // Enviar por WebSocket
                notificationService.sendNotificationToUser(userId, notification);
            } catch (Exception e) {
                // Log error pero continuar con otros usuarios
            }
        }
    }
    
    /**
     * DTO interno para datos de transferencia en la notificación
     */
    private record TransferNotificationData(
            Long transferId,
            Long itemId,
            String itemName,
            Long sourceInventoryId,
            String sourceInventoryName,
            Long destinationInventoryId,
            String destinationInventoryName,
            String status
    ) {}
}
