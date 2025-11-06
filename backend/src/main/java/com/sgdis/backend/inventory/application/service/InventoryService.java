package com.sgdis.backend.inventory.application.service;

import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.application.port.in.*;
import com.sgdis.backend.inventory.application.port.out.*;
import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.user.application.dto.InventoryManagerResponse;
import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;
import com.sgdis.backend.user.application.port.out.GetUserByIdRepository;
import com.sgdis.backend.user.domain.User;
import com.sun.security.auth.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

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

    private final CreateInventoryRepository createInventoryRepository;
    private final ListInventoryRepository  listInventoryRepository;
    private final GetInventoryByIdRepository getInventoryByIdRepository;
    private final DeleteInventoryRepository deleteInventoryRepository;
    private final UpdateInventoryRepository updateInventoryRepository;
    private final AssignedInventoryRepository assignedInventoryRepository;
    private final AssignManagerInventoryRepository assignManagerInventoryRepository;
    private final GetAllOwnedInventoriesRepository getAllOwnedInventoriesRepository;
    private final GetUserByIdRepository getUserByIdRepository;
    private final GetInventoryManagersRepository getInventoryManagersRepository;
    private final GetAllManagedInventoriesRepository getAllManagedInventoriesRepository;

    @Override
    public CreateInventoryResponse createInventory(CreateInventoryRequest request) {
        Inventory inventory = InventoryMapper.toDomain(request);
        Inventory savedInventory = createInventoryRepository.createInventory(inventory);
        return InventoryMapper.toCreateResponse(savedInventory);
    };

    @Override
    public List<InventoryResponse> listInventoryes() {
        return listInventoryRepository.findAllInventoryes()
                .stream()
                .map(InventoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public InventoryResponse getInventoryById(Long id) {
        return InventoryMapper.toResponse(getInventoryByIdRepository.getInventoryById(id));
    }

    @Override
    public InventoryResponse deleteInventoryById(Long id) {
        Inventory inventory = getInventoryByIdRepository.getInventoryById(id);
        deleteInventoryRepository.deleteInventory(id);
        return InventoryMapper.toResponse(inventory);
    }


    @Override
    public UpdateInventoryResponse updateInventory(Long id, UpdateInventoryRequest request) {
        Inventory inventory = InventoryMapper.toDomain(request,id);
        Inventory updatedInventory = updateInventoryRepository.updateInventory(inventory);
        return InventoryMapper.toUpdateResponse(updatedInventory);
    }

    @Override
    public AssignedInventoryResponse assignedInventory(AssignedInventoryRequest request) {
        Inventory inventory = getInventoryByIdRepository.getInventoryById(request.inventoryId());
        User owner = getUserByIdRepository.findUserById(request.userId());

        inventory.setOwner(owner);

        Inventory updated = assignedInventoryRepository.asignedInventory(inventory);

        return InventoryMapper.toAssignedResponse(updated);
    }

    @Override
    public AssignManagerInventoryResponse assignManagerInventory(AssignManagerInventoryRequest request) {
        User user = getUserByIdRepository.findUserById(request.managerId());
        Inventory inventory = getInventoryByIdRepository.getInventoryById(request.inventoryId());

        assignManagerInventoryRepository.assignManagerInventory(inventory, user);

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

        List<Inventory> ownedInventoriesDomain = getAllOwnedInventoriesRepository.getAllOwnedInventories(currentUserId);
        List<InventoryResponseWithoutOwnerAndManagers> ownedInventories = ownedInventoriesDomain.stream().map(inventory -> new InventoryResponseWithoutOwnerAndManagers(inventory.getId(), inventory.getUuid(), inventory.getLocation(), inventory.getName())).toList();

        return new GetAllOwnedInventoriesResponse(ownedInventories);
    }

    @Override
    public List<InventoryManagerResponse> getInventoryManagers(Long inventoryId) {
        return getInventoryManagersRepository.findManagersByInventoryId(inventoryId)
                .stream()
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
        List<Inventory> managedInventories = getAllManagedInventoriesRepository.getAllManagedInventories(userId);
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
