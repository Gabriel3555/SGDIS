package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.inventory.application.port.out.*;
import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
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
        AssignedInventoryRepository {

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

}
