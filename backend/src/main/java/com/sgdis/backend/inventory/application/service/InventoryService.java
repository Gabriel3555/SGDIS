package com.sgdis.backend.inventory.application.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.exception.ResourceNotFoundException;
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
import lombok.RequiredArgsConstructor;
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
                FindMyInventoryUseCase,
                AssignSignatoryInventoryUseCase,
                GetMySignatoryInventoriesUseCase,
                GetAllSignatoriesUseCase,
                QuitSignatoryInventoryUseCase,
                DeleteSignatoryInventoryUseCase,
                UpdateInventoryOwnerUseCase,
                QuitManagerInventoryUseCase{

        private final SpringDataInventoryRepository inventoryRepository;
        private final SpringDataUserRepository userRepository;
        private final AuthService authService;

        @Override
        @Transactional
        public CreateInventoryResponse createInventory(CreateInventoryRequest request) {
                UserEntity owner = userRepository.findById(request.ownerId())
                                .orElseThrow(() -> new UserNotFoundException(request.ownerId()));

                List<InventoryEntity> existingInventories = inventoryRepository
                                .findInventoryEntitiesByOwnerId(owner.getId());
                if (existingInventories != null && !existingInventories.isEmpty()) {
                        throw new IllegalArgumentException("This owner already has an assigned inventory");
                }

                InventoryEntity inventory = InventoryMapper.fromCreateRequest(request);
                inventory.setOwner(owner);

                InventoryEntity savedInventory = inventoryRepository.save(inventory);
                return InventoryMapper.toCreateResponse(savedInventory);
        }

        @Override
        public List<InventoryResponse> listInventoryes() {
                return inventoryRepository.findAll()
                                .stream()
                                .map(InventoryMapper::toResponse)
                                .collect(Collectors.toList());
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
                inventoryRepository.deleteById(id);
                return InventoryMapper.toResponse(inventory);
        }

        @Override
        @Transactional
        public UpdateInventoryResponse updateInventory(Long id, UpdateInventoryRequest request) {
                InventoryEntity inventory = inventoryRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id " + id));
                InventoryEntity updatedInventory = InventoryMapper.fromUpdateRequest(request, inventory);
                updatedInventory = inventoryRepository.save(updatedInventory);
                return InventoryMapper.toUpdateResponse(updatedInventory);
        }

        @Override
        @Transactional
        public InventoryResponse updateInventoryOwner(Long inventoryId, UpdateInventoryOwnerRequest request) {
                if (request.ownerId() == null) {
                        throw new IllegalArgumentException("Owner id is required");
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
                                throw new IllegalArgumentException("Este usuario ya es dueño en un inventario");
                        }

                        inventory.setOwner(newOwner);
                        inventory = inventoryRepository.save(inventory);
                }

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
                    throw new RuntimeException("Este usuario ya esta asignado como firmador a este inventario");
                }

                if (inventory.getManagers() != null && inventory.getManagers().contains(user)) {
                    throw new RuntimeException("Este usuario ya esta asignado como manejador a este inventario");
                }

                if (user.getMyOwnedInventory() == inventory) {
                    throw new RuntimeException("Este usuario ya esta esta asignado como dueño a este inventario");
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

            return new QuitInventoryResponse("Ha renunciado exitosamente a este inventario", inventory.getName());
        }



    @Override
    @Transactional
    public AssignSignatoryInventoryResponse assignSignatoryInventory(AssignSignatoryInventoryRequest request) {
        UserEntity user = userRepository.findById(request.signatoryId())
                .orElseThrow(() -> new UserNotFoundException(request.signatoryId()));

        InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + request.inventoryId()));

        if (inventory.getManagers() != null && inventory.getManagers().contains(user)) {
            throw new RuntimeException("Este usuario ya esta asignado como manejador a este inventario");
        }

        if (inventory.getSignatories() != null && inventory.getSignatories().contains(user)) {
            throw new RuntimeException("Este usuario ya esta asignado como firmador a este inventario");
        }

        if (user.getMyOwnedInventory() == inventory) {
            throw new RuntimeException("Este usuario ya esta esta asignado como dueño a este inventario");
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

        // Add user to inventory's signatories list
        if (!signatories.contains(user)) {
            signatories.add(user);
        }

        // Add inventory to user's signatories list
        if (!inventories.contains(inventory)) {
            inventories.add(inventory);
        }

        userRepository.save(user);
        inventoryRepository.save(inventory);

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

        return new QuitInventoryResponse(
                        "Successfully quit as manager",
                        inventory.getName());
    }
}
