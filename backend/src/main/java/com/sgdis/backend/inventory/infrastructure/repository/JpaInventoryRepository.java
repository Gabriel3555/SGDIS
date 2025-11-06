package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.inventory.application.port.out.*;
import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class JpaInventoryRepository implements
        CreateInventoryRepository,
        ListInventoryRepository,
        GetInventoryByIdRepository,
        UpdateInventoryRepository,
        DeleteInventoryRepository,
        AssignedInventoryRepository,
        AssignManagerInventoryRepository,
        GetAllOwnedInventoriesRepository,
        GetInventoryManagersRepository,
        GetAllManagedInventoriesRepository {

    private final SpringDataInventoryRepository springDataInventoryRepository;

    @Override
    public Inventory createInventory(Inventory inventory) {
        InventoryEntity entity = InventoryMapper.toEntity(inventory);
        InventoryEntity savedEntity = springDataInventoryRepository.save(entity);
        return InventoryMapper.toDomain(savedEntity);
    }

    @Override
    public List<Inventory> findAllInventoryes() {
        return springDataInventoryRepository.findAll()
                .stream()
                .map(InventoryMapper::toDomain)
                .toList();
    }


    @Override
    public Inventory getInventoryById(Long id) {
        return springDataInventoryRepository.findById(id)
                .map(InventoryMapper::toDomain)
                .orElseThrow(()-> new ResourceNotFoundException("No user found with id " + id));
    }


    @Override
    public void deleteInventory(Long id) {
        if(!springDataInventoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("No user found with id " + id);
        }
        springDataInventoryRepository.deleteById(id);
    }

    @Override
    public Inventory updateInventory(Inventory inventory) {
        InventoryEntity entity = InventoryMapper.toEntity(inventory);
        return InventoryMapper.toDomain(springDataInventoryRepository.save(entity));
    }


    @Override
    public Inventory asignedInventory(Inventory inventory) {
        InventoryEntity entity = InventoryMapper.toEntity(inventory);
        InventoryEntity saved =  springDataInventoryRepository.save(entity);
        return InventoryMapper.toDomain(saved);
    }

    @Override
    public Inventory assignManagerInventory(Inventory inventory, User user) {
        InventoryEntity entity = InventoryMapper.toEntity(inventory);
        UserEntity manager = UserMapper.toEntity(user);

        List<UserEntity> managers = entity.getManagers();

        managers.add(manager);
        entity.setManagers(managers);

        InventoryEntity inventoryManager = springDataInventoryRepository.save(entity);

        return InventoryMapper.toDomain(inventoryManager);
    }

    @Override
    public List<Inventory> getAllOwnedInventories(Long ownerId) {
        List<InventoryEntity> entities = springDataInventoryRepository.findInventoryEntitiesByOwnerId(ownerId);
        return entities.stream().map(InventoryMapper::toDomain).toList();
    }

    @Override
    public List<User> findManagersByInventoryId(Long inventoryId) {
        InventoryEntity inventory = springDataInventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + inventoryId));

        return inventory.getManagers().stream()
                .map(UserMapper::toDomain)
                .toList();
    }

    @Override
    public List<Inventory> getAllManagedInventories(Long managerId) {
        return springDataInventoryRepository.findInventoryEntitiesByManagerId(managerId)
                .stream()
                .map(InventoryMapper::toDomain)
                .toList();
    }
}
