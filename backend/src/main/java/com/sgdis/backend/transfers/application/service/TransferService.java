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
import com.sgdis.backend.transfers.application.dto.RequestTransferRequest;
import com.sgdis.backend.transfers.application.dto.RequestTransferResponse;
import com.sgdis.backend.transfers.application.dto.TransferSummaryResponse;
import com.sgdis.backend.transfers.application.dto.TransferStatisticsResponse;
import com.sgdis.backend.transfers.application.port.in.ApproveTransferUseCase;
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
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransferService implements ApproveTransferUseCase, RequestTransferUseCase, GetInventoryTransfersUseCase,
        GetItemTransfersUseCase, GetAllTransfersUseCase, GetRegionalTransfersUseCase, GetTransferStatisticsUseCase {

    private final AuthService authService;
    private final SpringDataTransferRepository transferRepository;
    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;
    private final RecordActionUseCase recordActionUseCase;

    @Override
    @Transactional
    public RequestTransferResponse requestTransfer(RequestTransferRequest request) {
        if (request == null) {
            throw new DomainValidationException("La solicitud de transferencia es obligatoria");
        }

        ItemEntity item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item no encontrado con id: " + request.itemId()));

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

        return TransferMapper.toApproveResponse(transfer);
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
}
