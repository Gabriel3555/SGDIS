package com.sgdis.backend.inventory.application.service;

import com.sgdis.backend.inventory.application.dto.*;
import com.sgdis.backend.inventory.application.port.in.*;
import com.sgdis.backend.inventory.application.port.out.*;
import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService implements CreateInventoryUseCase, ListInventoryUseCase, UpdateInventoryUseCase, DeleteInventoryUseCase, GetInventoryByIdUseCase {

    private final CreateInventoryRepository createInventoryRepository;
    private final ListInventoryRepository  listInventoryRepository;
    private final GetInventoryByIdRepository getInventoryByIdRepository;
    private final DeleteInventoryRepository deleteInventoryRepository;
    private final UpdateInventoryRepository updateInventoryRepository;

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
}
