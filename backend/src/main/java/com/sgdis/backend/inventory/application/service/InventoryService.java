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
                QuitInventoryUseCase,
                AssignManagerInventoryUseCase,
                DeleteManagerInventoryUseCase,
                GetInventoryManagersUseCase,
                GetAllManagedInventoriesUseCase,
                FindMyInventoryUseCase {

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
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Inventory not found with id: " + request.inventoryId()));

                UserEntity owner = userRepository.findById(request.userId())
                                .orElseThrow(() -> new UserNotFoundException(request.userId()));

                // Check if user already has an inventory assigned (excluding the current
                // inventory being assigned)
                List<InventoryEntity> existingInventories = inventoryRepository
                                .findInventoryEntitiesByOwnerId(request.userId());
                if (existingInventories != null && !existingInventories.isEmpty()) {
                        // Check if the user has a different inventory assigned (not the one being
                        // assigned now)
                        boolean hasOtherInventory = existingInventories.stream()
                                        .anyMatch(inv -> !inv.getId().equals(request.inventoryId()));

                        if (hasOtherInventory) {
                                throw new RuntimeException("This user already has an assigned inventory.");
                        }
                        // If the user already owns this inventory, allow the assignment (no error)
                }

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
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Inventory not found with id: " + request.inventoryId()));

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

                // Initialize managers list if null
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
                                "Manager removed from inventory successfully",
                                true);
        }

        @Override
        public List<InventoryManagerResponse> getInventoryManagers(Long inventoryId) {
                InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Inventory not found with id: " + inventoryId));

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
                                                inventory.getOwner() != null ? inventory.getOwner().getEmail() : null))
                                .toList();
        }

        @Override
        public InventoryResponse findMyInventory() {
                Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                UserEntity user = userRepository.getReferenceById(userId);
                InventoryEntity inventory = inventoryRepository.findInventoryEntityByOwner(user);

                if (inventory == null) {
                        return null;
                }

                return InventoryMapper.toResponse(inventoryRepository.findInventoryEntityByOwner(user));
        }

        @Override
        public QuitInventoryResponse quitInventory(Long inventoryId) {

                Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

                UserEntity user = userRepository.findById(userId)
                                .orElseThrow(() -> new UserNotFoundException(userId));

                InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Inventory not found with id: " + inventoryId));

                // Initialize managers list if null
                List<UserEntity> managers = inventory.getManagers();
                if (managers == null || !managers.contains(user)) {
                        throw new ResourceNotFoundException("Manager not found in inventory with id: " + inventoryId);
                }

                // Remove manager
                managers.remove(user);
                inventory.setManagers(managers);
                inventoryRepository.save(inventory);

                return new QuitInventoryResponse(
                                "Successfully quited inventory",
                                inventory.getName());
        }
}
