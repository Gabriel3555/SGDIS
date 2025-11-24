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
import com.sgdis.backend.transfers.application.port.in.ApproveTransferUseCase;
import com.sgdis.backend.transfers.application.port.in.GetInventoryTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.GetItemTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.RequestTransferUseCase;
import com.sgdis.backend.transfers.domain.TransferStatus;
import com.sgdis.backend.transfers.infrastructure.entity.TransferEntity;
import com.sgdis.backend.transfers.infrastructure.repository.SpringDataTransferRepository;
import com.sgdis.backend.transfers.mapper.TransferMapper;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransferService implements ApproveTransferUseCase, RequestTransferUseCase, GetInventoryTransfersUseCase,
        GetItemTransfersUseCase {

    private final AuthService authService;
    private final SpringDataTransferRepository transferRepository;
    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;

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

        if (transferRepository.existsByItemIdAndStatus(item.getId(), TransferStatus.PENDING)) {
            throw new DomainValidationException("Ya existe una transferencia pendiente para este ítem");
        }

        UserEntity requester = authService.getCurrentUser();
        if (!belongsToInventory(requester, sourceInventory) && requester.getRole() != Role.SUPERADMIN) {
            throw new DomainValidationException("No cuentas con permisos para solicitar la transferencia de este ítem");
        }

        TransferEntity transfer = TransferEntity.builder()
                .details(request.details() != null ? request.details().trim() : null)
                .item(item)
                .inventory(destinationInventory)
                .sourceInventory(sourceInventory)
                .requestedBy(requester)
                .approvalStatus(TransferStatus.PENDING)
                .status(true)
                .build();

        TransferEntity saved = transferRepository.save(transfer);
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
        if (!belongsToInventory(currentUser, inventory) && currentUser.getRole() != Role.SUPERADMIN) {
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
                && approver.getRole() != Role.SUPERADMIN) {
            throw new DomainValidationException("No cuentas con permisos para aprobar esta transferencia");
        }

        item.setInventory(destinationInventory);
        if (destinationInventory.getLocation() != null) {
            item.setLocation(destinationInventory.getLocation());
        }
        itemRepository.save(item);

        transfer.setSourceInventory(sourceInventory);
        transfer.setApprovalStatus(TransferStatus.APPROVED);
        transfer.setApprovedAt(LocalDateTime.now());
        transfer.setApprovedBy(approver);
        if (request != null && request.approvalNotes() != null && !request.approvalNotes().isBlank()) {
            transfer.setApprovalNotes(request.approvalNotes().trim());
        }
        transferRepository.save(transfer);

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
                && currentUser.getRole() != Role.SUPERADMIN) {
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
}
