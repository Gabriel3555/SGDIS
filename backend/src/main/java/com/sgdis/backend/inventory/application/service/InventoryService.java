package com.sgdis.backend.inventory.application.service;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.application.port.in.*;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.user.application.dto.InventoryManagerResponse;
import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.exception.userExceptions.UserNotFoundException;
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
        AssignedInventoryUseCase,
        AssignManagerInventoryUseCase,
        GetAllOwnedInventoriesUseCase,
        GetInventoryManagersUseCase,
        GetAllManagedInventoriesUseCase {

    private final SpringDataInventoryRepository inventoryRepository;
    private final SpringDataUserRepository userRepository;

    @Override
    @Transactional
    public CreateInventoryResponse createInventory(CreateInventoryRequest request) {
        InventoryEntity inventory = InventoryMapper.fromCreateRequest(request);
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
        InventoryEntity inventory = InventoryMapper.fromUpdateRequest(request, id);
        InventoryEntity updatedInventory = inventoryRepository.save(inventory);
        return InventoryMapper.toUpdateResponse(updatedInventory);
    }

    @Override
    @Transactional
    public AssignedInventoryResponse assignedInventory(AssignedInventoryRequest request) {
        InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + request.inventoryId()));

        // Validación de regional: verificar que la regional del usuario coincida con la del inventario
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UserEntity userEntity = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Solo validar regional si ambos (usuario e inventario) tienen regionales asignadas

        UserEntity owner = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException(request.userId()));
        inventory.setOwner(owner);

        InventoryEntity updated = inventoryRepository.save(inventory);

        return InventoryMapper.toAssignedResponse(updated);
    }

    @Override
    @Transactional
    public AssignManagerInventoryResponse assignManagerInventory(AssignManagerInventoryRequest request) {
        UserEntity user = userRepository.findById(request.managerId())
                .orElseThrow(() -> new UserNotFoundException(request.managerId()));
        
        InventoryEntity inventory = inventoryRepository.findById(request.inventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + request.inventoryId()));

        // Initialize managers list if null
        List<UserEntity> managers = inventory.getManagers();
        if (managers == null) {
            managers = new java.util.ArrayList<>();
            inventory.setManagers(managers);
        }

        // Add manager only if not already present
        if (!managers.contains(user)) {
            managers.add(user);
        }

        inventoryRepository.save(inventory);

        return new AssignManagerInventoryResponse(
                new AssignManagerInventoryUserResponse(user.getId(), user.getFullName(), user.getEmail()),
                inventory.getUuid(),
                "Assigned Inventory",
                true
        );
    }

    @Override
    public GetAllOwnedInventoriesResponse getAllOwnedInventories() {
        Long currentUserId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        List<InventoryEntity> ownedInventories = inventoryRepository.findInventoryEntitiesByOwnerId(currentUserId);
        List<InventoryResponseWithoutOwnerAndManagers> inventoryResponses = ownedInventories.stream()
                .map(inventory -> new InventoryResponseWithoutOwnerAndManagers(
                        inventory.getId(), 
                        inventory.getUuid(), 
                        inventory.getLocation(), 
                        inventory.getName()))
                .toList();

        return new GetAllOwnedInventoriesResponse(inventoryResponses);
    }

    @Override
    public List<InventoryManagerResponse> getInventoryManagers(Long inventoryId) {
        InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + inventoryId));

        return inventory.getManagers().stream()
                .map(manager -> new InventoryManagerResponse(
                        manager.getId(),
                        manager.getFullName(),
                        manager.getEmail(),
                        manager.getJobTitle(),
                        manager.getLaborDepartment(),
                        manager.getRole().name()
                ))
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
                        inventory.getOwner() != null ? inventory.getOwner().getFullName() : null,
                        inventory.getOwner() != null ? inventory.getOwner().getEmail() : null
                ))
                .toList();
    }
}
