package com.sgdis.backend.inventory.application.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.exception.DomainConflictException;
import com.sgdis.backend.exception.DomainValidationException;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.institution.infrastructure.repository.SpringDataInstitutionRepository;
import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.application.port.in.*;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.user.application.dto.InventoryManagerResponse;
import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;
import com.sgdis.backend.user.application.dto.UserResponse;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.exception.userExceptions.UserNotFoundException;
import com.sgdis.backend.user.mapper.UserMapper;
import com.sgdis.backend.notification.service.NotificationService;
// Auditoría
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService
        implements
                CreateInventoryUseCase,
                ListInventoryUseCase,
                UpdateInventoryUseCase,
                DeleteInventoryUseCase,
                GetInventoryByIdUseCase,
                QuitInventoryUseCase,
                AssignManagerInventoryUseCase,
                DeleteManagerInventoryUseCase,
                GetInventoryManagersUseCase,
                GetAllManagedInventoriesUseCase,
                GetMyManagedInventoriesUseCase,
                FindMyInventoryUseCase,
                AssignSignatoryInventoryUseCase,
                GetMySignatoryInventoriesUseCase,
                GetAllSignatoriesUseCase,
                QuitSignatoryInventoryUseCase,
                DeleteSignatoryInventoryUseCase,
                UpdateInventoryOwnerUseCase,
                UpdateInventoryInstitutionUseCase,
                QuitManagerInventoryUseCase{

        private final SpringDataInventoryRepository inventoryRepository;
        private final SpringDataUserRepository userRepository;
        private final SpringDataInstitutionRepository institutionRepository;
        private final AuthService authService;
        private final NotificationService notificationService;
        private final RecordActionUseCase recordActionUseCase;

        @Override
        @Transactional
        public CreateInventoryResponse createInventory(CreateInventoryRequest request) {
                UserEntity owner = userRepository.findById(request.ownerId())
                                .orElseThrow(() -> new UserNotFoundException(request.ownerId()));

                List<InventoryEntity> existingInventories = inventoryRepository
                                .findInventoryEntitiesByOwnerId(owner.getId());
                if (existingInventories != null && !existingInventories.isEmpty()) {
                        InventoryEntity existingInventory = existingInventories.get(0);
                        String inventoryName = existingInventory.getName() != null ? existingInventory.getName() : "sin nombre";
                        throw new DomainConflictException(
                                String.format("El usuario '%s' (ID: %d) ya tiene un inventario asignado como propietario: '%s' (ID: %d). Un usuario solo puede ser propietario de un inventario a la vez.",
                                        owner.getFullName() != null ? owner.getFullName() : owner.getEmail(),
                                        owner.getId(),
                                        inventoryName,
                                        existingInventory.getId())
                        );
                }

                // Validar que institutionId no sea null
                if (request.institutionId() == null) {
                        throw new DomainValidationException("La institución es obligatoria para crear un inventario");
                }

                InstitutionEntity institution = institutionRepository.findById(request.institutionId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Institution not found with id " + request.institutionId()));

                InventoryEntity inventory = InventoryMapper.fromCreateRequest(request);
                inventory.setOwner(owner);
                inventory.setInstitution(institution);

                InventoryEntity savedInventory = inventoryRepository.save(inventory);
                
                // Enviar notificación al dueño del inventario
                notificationService.sendInventoryCreatedNotification(
                        owner.getId(), 
                        savedInventory.getName(), 
                        savedInventory.getId()
                );
                
                // Registrar auditoría
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Inventario creado: %s (ID: %d) - Propietario: %s (%s)", 
                                savedInventory.getName() != null ? savedInventory.getName() : "sin nombre",
                                savedInventory.getId(),
                                owner.getFullName(),
                                owner.getEmail())
                ));
                
                return InventoryMapper.toCreateResponse(savedInventory);
        }

        @Override
        public Page<InventoryResponse> listInventoryes(Pageable pageable) {
                return inventoryRepository.findAll(pageable)
                                .map(InventoryMapper::toResponse);
        }

        @Override
        public InventoryResponse getInventoryById(Long id) {
                InventoryEntity inventory = inventoryRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + id));
                return InventoryMapper.toResponse(inventory);
        }

        @Override
        @Transactional
        public InventoryResponse deleteInventoryById(Long id) {
                InventoryEntity inventory = inventoryRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + id));
                
                String inventoryName = inventory.getName() != null ? inventory.getName() : "sin nombre";
                String ownerName = inventory.getOwner() != null ? inventory.getOwner().getFullName() : "N/A";
                String ownerEmail = inventory.getOwner() != null ? inventory.getOwner().getEmail() : "N/A";
                
                inventoryRepository.deleteById(id);
                
                // Registrar auditoría
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Inventario eliminado: %s (ID: %d) - Propietario: %s (%s)", 
                                inventoryName, id, ownerName, ownerEmail)
                ));
                
                return InventoryMapper.toResponse(inventory);
        }

        @Override
        @Transactional
        public UpdateInventoryResponse updateInventory(Long id, UpdateInventoryRequest request) {
                InventoryEntity inventory = inventoryRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + id));
                
                String originalName = inventory.getName();
                String originalLocation = inventory.getLocation();
                boolean originalStatus = inventory.isStatus();
                
                InventoryEntity updatedInventory = InventoryMapper.fromUpdateRequest(request, inventory);
                updatedInventory = inventoryRepository.save(updatedInventory);
                
                // Registrar auditoría
                StringBuilder changes = new StringBuilder();
                if (request.name() != null && !request.name().equals(originalName)) {
                        changes.append("Nombre actualizado | ");
                }
                if (request.location() != null && !request.location().equals(originalLocation)) {
                        changes.append("Ubicación actualizada | ");
                }
                if (request.status() != null && request.status() != originalStatus) {
                        changes.append("Estado actualizado | ");
                }
                
                String changesDescription = changes.length() > 0 
                        ? changes.toString().substring(0, changes.length() - 3) 
                        : "Sin cambios";
                
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Inventario actualizado: %s (ID: %d) - %s", 
                                updatedInventory.getName() != null ? updatedInventory.getName() : "sin nombre",
                                id,
                                changesDescription)
                ));
                
                return InventoryMapper.toUpdateResponse(updatedInventory);
        }

        @Override
        @Transactional
        public InventoryResponse updateInventoryOwner(Long inventoryId, UpdateInventoryOwnerRequest request) {
                if (request.ownerId() == null) {
                        throw new DomainValidationException("El ID del propietario es requerido");
                }

                InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + inventoryId));

                UserEntity newOwner = userRepository.findById(request.ownerId())
                                .orElseThrow(() -> new UserNotFoundException(request.ownerId()));

                boolean isSameOwner = inventory.getOwner() != null
                                && inventory.getOwner().getId().equals(newOwner.getId());

                if (!isSameOwner) {
                        final Long currentInventoryId = inventory.getId();
                        List<InventoryEntity> existingInventories = inventoryRepository
                                        .findInventoryEntitiesByOwnerId(newOwner.getId());

                        boolean ownsOtherInventory = existingInventories.stream()
                                        .anyMatch(inv -> !inv.getId().equals(currentInventoryId));

                        if (ownsOtherInventory) {
                                throw new DomainConflictException("Este usuario ya es dueño de un inventario");
                        }

                        // Guardar información del propietario anterior para auditoría
                        String oldOwnerName = inventory.getOwner() != null ? inventory.getOwner().getFullName() : "N/A";
                        String oldOwnerEmail = inventory.getOwner() != null ? inventory.getOwner().getEmail() : "N/A";
                        
                        inventory.setOwner(newOwner);
                        inventory = inventoryRepository.save(inventory);
                        
                        // Registrar auditoría
                        recordActionUseCase.recordAction(new RecordActionRequest(
                                String.format("Propietario de inventario actualizado: %s (ID: %d) - Anterior: %s (%s) → Nuevo: %s (%s)", 
                                        inventory.getName() != null ? inventory.getName() : "sin nombre",
                                        inventory.getId(),
                                        oldOwnerName,
                                        oldOwnerEmail,
                                        newOwner.getFullName(),
                                        newOwner.getEmail())
                        ));
                }

                return InventoryMapper.toResponse(inventory);
        }

        @Override
        @Transactional
        public InventoryResponse updateInventoryInstitution(Long inventoryId, UpdateInventoryInstitutionRequest request) {
                if (request.institutionId() == null) {
                        throw new DomainValidationException("El ID de la institución es requerido");
                }

                InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + inventoryId));

                InstitutionEntity institution = institutionRepository.findById(request.institutionId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Institution not found with id " + request.institutionId()));

                String oldInstitutionName = inventory.getInstitution() != null ? inventory.getInstitution().getName() : "N/A";
                inventory.setInstitution(institution);
                inventory = inventoryRepository.save(inventory);

                // Registrar auditoría
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Institución de inventario actualizada: %s (ID: %d) - Nueva institución: %s", 
                                inventory.getName() != null ? inventory.getName() : "sin nombre",
                                inventory.getId(),
                                institution.getName())
                ));

                return InventoryMapper.toResponse(inventory);
        }

        @Override
        @Transactional
        public AssignManagerInventoryResponse assignManagerInventory(AssignManagerInventoryRequest request) {
                UserEntity user = userRepository.findById(request.managerId())
                                .orElseThrow(() -> new UserNotFoundException(request.managerId()));

                InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Inventory not found with id: " + request.inventoryId()));

                if (inventory.getSignatories() != null && inventory.getSignatories().contains(user)) {
                    throw new DomainConflictException("Este usuario ya está asignado como firmante a este inventario");
                }

                if (inventory.getManagers() != null && inventory.getManagers().contains(user)) {
                    throw new DomainConflictException("Este usuario ya está asignado como manejador a este inventario");
                }

                if (user.getMyOwnedInventory() == inventory) {
                    throw new DomainConflictException("Este usuario ya está asignado como dueño a este inventario");
                }

                List<UserEntity> managers = inventory.getManagers();
                if (managers == null) {
                        managers = new java.util.ArrayList<>();
                        inventory.setManagers(managers);
                }

                if (!managers.contains(user)) {
                        managers.add(user);
                }

                inventoryRepository.save(inventory);

                // Registrar auditoría
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Manejador asignado a inventario: %s (ID: %d) - Manejador: %s (%s)", 
                                inventory.getName() != null ? inventory.getName() : "sin nombre",
                                inventory.getId(),
                                user.getFullName(),
                                user.getEmail())
                ));

                return new AssignManagerInventoryResponse(
                                new AssignManagerInventoryUserResponse(user.getId(), user.getFullName(),
                                                user.getEmail()),
                                inventory.getUuid(),
                                "Assigned Inventory",
                                true);
        }

        @Override
        @Transactional
        public DeleteManagerInventoryResponse deleteManagerInventory(DeleteManagerInventoryRequest request) {
                UserEntity user = userRepository.findById(request.managerId())
                                .orElseThrow(() -> new UserNotFoundException(request.managerId()));

                InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Inventory not found with id: " + request.inventoryId()));

                List<UserEntity> managers = inventory.getManagers();
                if (managers == null || !managers.contains(user)) {
                        throw new ResourceNotFoundException(
                                        "Manager not found in inventory with id: " + request.inventoryId());
                }

                // Remove manager
                managers.remove(user);
                inventory.setManagers(managers);
                inventoryRepository.save(inventory);

                // Registrar auditoría
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Manejador eliminado de inventario: %s (ID: %d) - Manejador: %s (%s)", 
                                inventory.getName() != null ? inventory.getName() : "sin nombre",
                                inventory.getId(),
                                user.getFullName(),
                                user.getEmail())
                ));

                return new DeleteManagerInventoryResponse(
                                user.getId(),
                                user.getFullName(),
                                user.getEmail(),
                                inventory.getId(),
                                inventory.getName(),
                                "Manejador eliminado exitosamente",
                                true);
        }

        @Override
        public List<InventoryManagerResponse> getInventoryManagers(Long inventoryId) {
                InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                                .orElseThrow(() -> new ResourceNotFoundException("Este inventario no fue encontrado"));

                return inventory.getManagers().stream()
                                .map(manager -> new InventoryManagerResponse(
                                                manager.getId(),
                                                manager.getFullName(),
                                                manager.getEmail(),
                                                manager.getJobTitle(),
                                                manager.getLaborDepartment(),
                                                manager.getRole().name()))
                                .toList();
        }

        @Override
        public List<ManagedInventoryResponse> getAllManagedInventories(Long userId) {
                List<InventoryEntity> managedInventories = inventoryRepository.findInventoryEntitiesByManagerId(userId);
                return managedInventories.stream()
                                .map(inventory -> new ManagedInventoryResponse(
                                                inventory.getId(),
                                                inventory.getUuid(),
                                                inventory.getName(),
                                                inventory.getLocation(),
                                                inventory.getOwner() != null ? inventory.getOwner().getId() : null,
                                                inventory.getOwner() != null ? inventory.getOwner().getFullName()
                                                                : null,
                                                inventory.getOwner() != null ? inventory.getOwner().getEmail() : null,
                                                inventory.isStatus()))
                                .toList();
        }

        @Override
        public List<ManagedInventoryResponse> getMyManagedInventories() {
                UserEntity currentUser = authService.getCurrentUser();
                return getAllManagedInventories(currentUser.getId());
        }

        @Override
        public InventoryResponse findMyInventory() {
            UserEntity user = authService.getCurrentUser();

            InventoryEntity inventory = inventoryRepository.findInventoryEntityByOwner(user);

                if (inventory == null) {
                        return null;
                }

                return InventoryMapper.toResponse(inventoryRepository.findInventoryEntityByOwner(user));
        }

        @Override
        public QuitInventoryResponse quitInventory(Long inventoryId) {
            UserEntity user = authService.getCurrentUser();

            InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + inventoryId));

            List<UserEntity> managers = inventory.getManagers();
            if (managers == null || !managers.contains(user)) {
                throw new ResourceNotFoundException("Manager not found in inventory with id: " + inventoryId);
            }

            managers.remove(user);
            inventory.setManagers(managers);
            inventoryRepository.save(inventory);

            // Registrar auditoría
            recordActionUseCase.recordAction(new RecordActionRequest(
                    String.format("Manejador renunció a inventario: %s (ID: %d) - Manejador: %s (%s)", 
                            inventory.getName() != null ? inventory.getName() : "sin nombre",
                            inventory.getId(),
                            user.getFullName(),
                            user.getEmail())
            ));

            return new QuitInventoryResponse("Ha renunciado exitosamente a este inventario", inventory.getName());
        }



    @Override
    @Transactional
    public AssignSignatoryInventoryResponse assignSignatoryInventory(AssignSignatoryInventoryRequest request) {
        UserEntity user = userRepository.findById(request.signatoryId())
                .orElseThrow(() -> new UserNotFoundException(request.signatoryId()));

        InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado "));

        if (inventory.getManagers() != null && inventory.getManagers().contains(user)) {
            throw new DomainConflictException("Este usuario ya está asignado como manejador a este inventario");
        }

        if (inventory.getSignatories() != null && inventory.getSignatories().contains(user)) {
            throw new DomainConflictException("Este usuario ya está asignado como firmante a este inventario");
        }

        if (user.getMyOwnedInventory() == inventory) {
            throw new DomainConflictException("Este usuario ya está asignado como dueño a este inventario");
        }

        List<UserEntity> signatories = inventory.getSignatories();
        if (signatories == null) {
            signatories = new java.util.ArrayList<>();
            inventory.setSignatories(signatories);
        }

        List<InventoryEntity> inventories = user.getMySignatories();
        if (inventories == null) {
            inventories = new java.util.ArrayList<>();
            user.setMySignatories(inventories);
        }

        if (!signatories.contains(user)) {
            signatories.add(user);
        }

        if (!inventories.contains(inventory)) {
            inventories.add(inventory);
        }

        userRepository.save(user);
        inventoryRepository.save(inventory);

        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Firmante asignado a inventario: %s (ID: %d) - Firmante: %s (%s)", 
                        inventory.getName() != null ? inventory.getName() : "sin nombre",
                        inventory.getId(),
                        user.getFullName(),
                        user.getEmail())
        ));

        return new AssignSignatoryInventoryResponse(
                new AssignSignatoryInventoryUserResponse(user.getId(), user.getFullName(), user.getEmail()),
                inventory.getUuid(),
                "Assigned Signatory",
                true
        );
    }

    @Override
    @Transactional
    public QuitInventoryResponse quitSignatoryInventory(Long inventoryId) {
        UserEntity user = authService.getCurrentUser();

        InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encotrado"));

        List<InventoryEntity> userInventories = user.getMySignatories();

        boolean hasAccess = userInventories != null && userInventories.stream()
                .anyMatch(inv -> inv.getId().equals(inventoryId));

        if (!hasAccess) {
            throw new ResourceNotFoundException("Este usuario no es firmador en este inventario");
        }

        List<UserEntity> signatories = inventory.getSignatories();
        if (signatories != null) {
            signatories.remove(user);
            inventory.setSignatories(signatories);
            inventoryRepository.save(inventory);
        }

        userInventories.remove(inventory);
        user.setMySignatories(userInventories);
        userRepository.save(user);

        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Firmante renunció a inventario: %s (ID: %d) - Firmante: %s (%s)", 
                        inventory.getName() != null ? inventory.getName() : "sin nombre",
                        inventory.getId(),
                        user.getFullName(),
                        user.getEmail())
        ));

        return new QuitInventoryResponse(
                "Ha renunciado exitosamente al inventario " + inventory.getName(),
                inventory.getName()
        );
    }

    @Override
    @Transactional
    public DeleteSignatoryInventoryResponse deleteSignatoryInventory(DeleteSignatoryInventoryRequest request) {
        UserEntity user = userRepository.findById(request.signatoryId())
                .orElseThrow(() -> new UserNotFoundException(request.signatoryId()));

        InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + request.inventoryId()));

        List<InventoryEntity> userInventories = user.getMySignatories();

        boolean hasAccess = userInventories != null && userInventories.stream()
                .anyMatch(inv -> inv.getId().equals(request.inventoryId()));

        if (!hasAccess) {
            throw new ResourceNotFoundException("Este usuario no es firmador en este inventario");
        }

        List<UserEntity> signatories = inventory.getSignatories();
        if (signatories != null) {
            signatories.remove(user);
            inventory.setSignatories(signatories);
            inventoryRepository.save(inventory);
        }

        List<InventoryEntity> inventorySignatories = user.getMySignatories();
        if (inventorySignatories != null) {
            inventorySignatories.remove(inventory);
            user.setMySignatories(inventorySignatories);
            userRepository.save(user);
        }

        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Firmante eliminado de inventario: %s (ID: %d) - Firmante: %s (%s)", 
                        inventory.getName() != null ? inventory.getName() : "sin nombre",
                        inventory.getId(),
                        user.getFullName(),
                        user.getEmail())
        ));

        return new DeleteSignatoryInventoryResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                inventory.getId(),
                inventory.getName(),
                "Firmador eliminado exitosamente",
                true
        );
    }

    @Override
    public List<InventoryResponse> getMySignatoryInventories() {
        UserEntity user = authService.getCurrentUser();

        if (user.getMySignatories() != null) {
            return user.getMySignatories().stream().map(InventoryMapper::toResponse).toList();
        }

        return List.of();
    }

    @Override
    public GetAllSignatoriesResponse getAllSignatories(GetAllSignatoriesRequest request) {
        InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + request.inventoryId()));

        List<UserResponse> signatories = inventory.getSignatories() != null
                ? inventory.getSignatories().stream()
                .map(UserMapper::toResponse)
                .collect(Collectors.toList())
                : List.of();

        return new GetAllSignatoriesResponse(
                InventoryMapper.toResponse(inventory),
                signatories
        );
    }

    @Override
    @Transactional
    public QuitInventoryResponse quitManagerInventory(Long inventoryId) {
        UserEntity user = authService.getCurrentUser();

        InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                        .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado"));

        List<UserEntity> managers = inventory.getManagers();
        if (managers == null || !managers.contains(user)) {
                throw new ResourceNotFoundException("Este manejador no fue encontrado en este inventario");
        }

        managers.remove(user);
        inventory.setManagers(managers);
        inventoryRepository.save(inventory);

        List<InventoryEntity> inventoryEntities = user.getMyManagers();

        inventoryEntities.remove(inventory);
        user.setMyManagers(inventoryEntities);
        userRepository.save(user);

        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Manejador renunció a inventario: %s (ID: %d) - Manejador: %s (%s)", 
                        inventory.getName() != null ? inventory.getName() : "sin nombre",
                        inventory.getId(),
                        user.getFullName(),
                        user.getEmail())
        ));

        return new QuitInventoryResponse(
                        "Successfully quit as manager",
                        inventory.getName());
    }
}
