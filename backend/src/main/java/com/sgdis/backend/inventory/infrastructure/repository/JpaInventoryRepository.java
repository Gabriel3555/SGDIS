package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.inventory.application.dto.AssignedRegionalRequest;
import com.sgdis.backend.inventory.application.dto.InventoryRegionalDTO;
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
import java.util.Optional;

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
    private final SpringDataRegionalRepository  springDataRegionalRepository;

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
        // Cargar la entidad existente para preservar los managers y otros datos
        InventoryEntity existingEntity = springDataInventoryRepository.findById(inventory.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + inventory.getId()));
        
        // Actualizar solo el owner, preservando managers y otros campos
        if (inventory.getOwner() != null) {
            existingEntity.setOwner(UserMapper.toEntityShallow(inventory.getOwner()));
        }
        
        // Guardar la entidad actualizada
        InventoryEntity saved = springDataInventoryRepository.save(existingEntity);
        return InventoryMapper.toDomain(saved);
    }

    @Override
    public Inventory assignManagerInventory(Inventory inventory, User user) {
        // Load the existing entity to preserve managers and other data
        InventoryEntity existingEntity = springDataInventoryRepository.findById(inventory.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + inventory.getId()));
        
        UserEntity manager = UserMapper.toEntity(user);

        // Initialize managers list if null
        List<UserEntity> managers = existingEntity.getManagers();
        if (managers == null) {
            managers = new java.util.ArrayList<>();
            existingEntity.setManagers(managers);
        }

        // Add manager only if not already present
        if (!managers.contains(manager)) {
            managers.add(manager);
        }

        InventoryEntity inventoryManager = springDataInventoryRepository.save(existingEntity);

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
