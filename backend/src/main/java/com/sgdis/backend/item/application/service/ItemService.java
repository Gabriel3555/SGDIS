package com.sgdis.backend.item.application.service;

import com.sgdis.backend.category.infrastructure.entity.CategoryEntity;
import com.sgdis.backend.category.infrastructure.repository.SpringDataCategoryRepository;
import com.sgdis.backend.category.mapper.CategoryMapper;
import com.sgdis.backend.exception.DomainNotFoundException;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.item.application.dto.*;
import com.sgdis.backend.item.application.port.CreateItemUseCase;
import com.sgdis.backend.item.application.port.GetItemByLicencePlateNumberUseCase;
import com.sgdis.backend.item.application.port.GetItemBySerialUseCase;
import com.sgdis.backend.item.application.port.GetItemsByInventoryAndCategoryUseCase;
import com.sgdis.backend.item.application.port.GetItemsByInventoryUseCase;
import com.sgdis.backend.item.application.port.UpdateItemUseCase;
import com.sgdis.backend.item.domain.Attribute;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.sgdis.backend.item.mapper.ItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService implements
        CreateItemUseCase,
        UpdateItemUseCase,
        GetItemsByInventoryUseCase,
        GetItemsByInventoryAndCategoryUseCase,
        GetItemByLicencePlateNumberUseCase,
        GetItemBySerialUseCase {

    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;
    private final SpringDataCategoryRepository categoryRepository;

    @Override
    public CreateItemResponse createItem(CreateItemRequest request) {
        ItemEntity itemEntity = ItemMapper.toEntity(request);
        InventoryEntity inventoryEntity = inventoryRepository.getReferenceById(request.inventoryId());
        CategoryEntity categoryEntity = categoryRepository.getReferenceById(request.categoryId());

        List<ItemEntity> itemEntityList = inventoryEntity.getItems();
        itemEntityList.add(itemEntity);

        inventoryEntity.setItems(itemEntityList);
        itemEntity.setInventory(inventoryEntity);
        itemEntity.setCategory(categoryEntity);
        itemEntity.setLocation(inventoryEntity.getLocation() != null ? inventoryEntity.getLocation() : "");

        if (request.acquisitionValue() != null) inventoryEntity.setTotalPrice(inventoryEntity.getTotalPrice() + request.acquisitionValue());

        inventoryRepository.save(inventoryEntity);
        itemRepository.save(itemEntity);

        return new CreateItemResponse(itemEntity.getProductName(), "Successfully created item");
    }

    @Override
    public UpdateItemResponse updateItem(UpdateItemRequest request) {
        ItemEntity existingItem = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new DomainNotFoundException("Item not found with id: " + request.itemId()));

        ItemEntity updatedItem = ItemMapper.toEntity(request, existingItem);
        itemRepository.save(updatedItem);

        return new UpdateItemResponse(updatedItem.getId(), "Item updated successfully");
    }

    @Override
    public Page<ItemDTO> getItemsByInventory(Long inventoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ItemEntity> itemEntities = itemRepository.findByInventoryId(inventoryId, pageable);
        return itemEntities.map(ItemMapper::toDTO);
    }

    @Override
    public Page<ItemDTO> getItemsByInventoryAndCategory(Long inventoryId, Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ItemEntity> itemEntities = itemRepository.findByInventoryIdAndCategoryId(inventoryId, categoryId, pageable);
        return itemEntities.map(ItemMapper::toDTO);
    }

    @Override
    public ItemDTO getItemByLicencePlateNumber(String licencePlateNumber) {
        ItemEntity item = itemRepository.findByLicencePlateNumber(licencePlateNumber)
                .orElseThrow(() -> new DomainNotFoundException(
                        "Item not found with licence plate number: " + licencePlateNumber));
        return ItemMapper.toDTO(item);
    }

    @Override
    public ItemDTO getItemBySerial(String serial) {
        ItemEntity item = itemRepository.findByAttribute(Attribute.SERIAL, serial)
                .orElseThrow(() -> new DomainNotFoundException(
                        "Item not found with serial: " + serial));
        return ItemMapper.toDTO(item);
    }
}