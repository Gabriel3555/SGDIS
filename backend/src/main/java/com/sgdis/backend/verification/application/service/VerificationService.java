package com.sgdis.backend.verification.application.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.exception.DomainValidationException;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.item.domain.Attribute;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.verification.application.dto.CreateVerificationByLicencePlateNumberRequest;
import com.sgdis.backend.verification.application.dto.CreateVerificationBySerialRequest;
import com.sgdis.backend.verification.application.dto.CreateVerificationResponse;
import com.sgdis.backend.verification.application.dto.LatestVerificationResponse;
import com.sgdis.backend.verification.application.dto.VerificationResponse;
import com.sgdis.backend.verification.application.port.in.CreateVerificationByLicencePlateNumberUseCase;
import com.sgdis.backend.verification.application.port.in.CreateVerificationBySerialUseCase;
import com.sgdis.backend.verification.application.port.in.GetItemVerificationsUseCase;
import com.sgdis.backend.verification.application.port.in.GetLatestInventoryVerificationsUseCase;
import com.sgdis.backend.verification.application.port.in.GetVerificationsByItemUseCase;
import com.sgdis.backend.verification.infrastructure.entity.VerificationEntity;
import com.sgdis.backend.verification.infrastructure.repository.SpringDataVerificationRepository;
import com.sgdis.backend.verification.mapper.VerificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VerificationService implements 
        CreateVerificationBySerialUseCase, 
        CreateVerificationByLicencePlateNumberUseCase, 
        GetVerificationsByItemUseCase,
        GetItemVerificationsUseCase,
        GetLatestInventoryVerificationsUseCase {

    private final AuthService authService;
    private final SpringDataVerificationRepository verificationRepository;
    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;

    @Override
    @Transactional
    public CreateVerificationResponse createVerificationBySerial(CreateVerificationBySerialRequest request) {
        // Obtener usuario actual
        UserEntity user = authService.getCurrentUser();

        // Buscar el ítem por serial
        ItemEntity item = itemRepository.findByAttribute(Attribute.SERIAL, request.serial())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Item not found with serial: " + request.serial()));

        // Validar que el usuario está autorizado a verificar este ítem
        validateUserAuthorization(user, item);

        // Validar coherencia de la información
        validateVerificationCoherence(item);

        // Crear la entidad de verificación
        VerificationEntity verification = VerificationMapper.toEntity(item, user);

        // Guardar la verificación
        VerificationEntity savedVerification = verificationRepository.save(verification);

        return new CreateVerificationResponse(
                savedVerification.getId(),
                "Verification created successfully"
        );
    }

    @Override
    @Transactional
    public CreateVerificationResponse createVerificationByLicencePlateNumber(CreateVerificationByLicencePlateNumberRequest request) {
        // Obtener usuario actual
        UserEntity user = authService.getCurrentUser();

        // Buscar el ítem por licencePlateNumber
        ItemEntity item = itemRepository.findByLicencePlateNumber(request.licencePlateNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Item not found with licence plate number: " + request.licencePlateNumber()));

        // Validar que el usuario está autorizado a verificar este ítem
        validateUserAuthorization(user, item);

        // Validar coherencia de la información
        validateVerificationCoherence(item);

        // Crear la entidad de verificación
        VerificationEntity verification = VerificationMapper.toEntity(item, user);

        // Guardar la verificación
        VerificationEntity savedVerification = verificationRepository.save(verification);

        return new CreateVerificationResponse(
                savedVerification.getId(),
                "Verification created successfully"
        );
    }

    @Override
    public List<VerificationResponse> getVerificationsByItemId(Long itemId) {
        // Validar que el ítem existe
        itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        // Obtener todas las verificaciones del ítem ordenadas por fecha descendente
        List<VerificationEntity> verifications = verificationRepository.findAllByItemIdOrderByCreatedAtDesc(itemId);

        return VerificationMapper.toDtoList(verifications);
    }

    @Override
    public List<LatestVerificationResponse> getLatestVerificationsByInventory(Long inventoryId, int limit) {
        if (limit <= 0) {
            throw new DomainValidationException("Limit must be greater than 0");
        }

        inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + inventoryId));

        var pageable = PageRequest.of(0, limit);
        List<VerificationEntity> verifications = verificationRepository.findLatestByInventory(inventoryId, pageable);
        return VerificationMapper.toLatestDtoList(verifications);
    }

    @Override
    public Page<VerificationResponse> getItemVerifications(Long itemId, int page, int size) {
        if (page < 0 || size <= 0) {
            throw new DomainValidationException("Invalid pagination parameters");
        }

        itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        var pageable = PageRequest.of(page, size);
        var verificationsPage = verificationRepository.findAllByItemId(itemId, pageable);
        return verificationsPage.map(VerificationMapper::toDto);
    }

    /**
     * Valida que el usuario esté autorizado a verificar el ítem.
     * Un usuario puede verificar un ítem si:
     * - Es manager del inventario al que pertenece el ítem
     * - Es owner del inventario al que pertenece el ítem
     * - Es signatario del inventario al que pertenece el ítem
     */
    private void validateUserAuthorization(UserEntity user, ItemEntity item) {
        InventoryEntity inventory = item.getInventory();
        
        if (inventory == null) {
            throw new DomainValidationException("Item does not belong to any inventory");
        }

        // Verificar si el usuario es owner del inventario
        if (inventory.getOwner() != null && inventory.getOwner().getId().equals(user.getId())) {
            return;
        }

        // Verificar si el usuario es manager del inventario
        if (inventory.getManagers() != null && inventory.getManagers().contains(user)) {
            return;
        }

        // Verificar si el usuario es signatario del inventario
        if (inventory.getSignatories() != null && inventory.getSignatories().contains(user)) {
            return;
        }

        // Si no cumple ninguna condición, lanzar excepción
        throw new DomainValidationException(
                "User is not authorized to verify items from inventory: " + inventory.getName()
        );
    }

    /**
     * Valida la coherencia de la información del ítem antes de crear la verificación.
     */
    private void validateVerificationCoherence(ItemEntity item) {
        // Validar que el ítem tiene un número de placa válido
        if (item.getLicencePlateNumber() == null || item.getLicencePlateNumber().trim().isEmpty()) {
            throw new DomainValidationException("Item must have a valid licence plate number");
        }

        // Validar que el ítem pertenece a un inventario
        if (item.getInventory() == null) {
            throw new DomainValidationException("Item must belong to an inventory");
        }
    }
}

