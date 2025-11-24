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
        
        // Category is optional - can be null and added manually later
        CategoryEntity categoryEntity = null;
        if (request.categoryId() != null) {
            categoryEntity = categoryRepository.getReferenceById(request.categoryId());
        }

        List<ItemEntity> itemEntityList = inventoryEntity.getItems();
        itemEntityList.add(itemEntity);

        inventoryEntity.setItems(itemEntityList);
        itemEntity.setInventory(inventoryEntity);
        itemEntity.setCategory(categoryEntity);
        
        // Usar location del request si está presente, sino usar el del inventario
        String location = request.location();
        if (location == null || location.trim().isEmpty()) {
            location = inventoryEntity.getLocation() != null ? inventoryEntity.getLocation() : "";
        }
        // Truncar location a máximo 255 caracteres
        if (location.length() > 255) {
            location = location.substring(0, 252) + "...";
        }
        itemEntity.setLocation(location);
        
        // Asegurar que todos los campos String no excedan 255 caracteres
        truncateItemStringFields(itemEntity);

        if (request.acquisitionValue() != null) {
            Double currentTotal = inventoryEntity.getTotalPrice() != null ? inventoryEntity.getTotalPrice() : 0.0;
            inventoryEntity.setTotalPrice(currentTotal + request.acquisitionValue());
        }

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

    /**
     * Trunca todos los campos String de ItemEntity a máximo 255 caracteres
     * para evitar errores de base de datos.
     */
    private void truncateItemStringFields(ItemEntity item) {
        if (item.getIrId() != null && item.getIrId().length() > 255) {
            item.setIrId(item.getIrId().substring(0, 252) + "...");
        }
        if (item.getProductName() != null && item.getProductName().length() > 255) {
            item.setProductName(item.getProductName().substring(0, 252) + "...");
        }
        if (item.getWareHouseDescription() != null && item.getWareHouseDescription().length() > 255) {
            item.setWareHouseDescription(item.getWareHouseDescription().substring(0, 252) + "...");
        }
        if (item.getLicencePlateNumber() != null && item.getLicencePlateNumber().length() > 255) {
            item.setLicencePlateNumber(item.getLicencePlateNumber().substring(0, 252) + "...");
        }
        if (item.getConsecutiveNumber() != null && item.getConsecutiveNumber().length() > 255) {
            item.setConsecutiveNumber(item.getConsecutiveNumber().substring(0, 252) + "...");
        }
        if (item.getSkuDescription() != null && item.getSkuDescription().length() > 255) {
            item.setSkuDescription(item.getSkuDescription().substring(0, 252) + "...");
        }
        if (item.getDescriptionElement() != null && item.getDescriptionElement().length() > 255) {
            item.setDescriptionElement(item.getDescriptionElement().substring(0, 252) + "...");
        }
        if (item.getIvId() != null && item.getIvId().length() > 255) {
            item.setIvId(item.getIvId().substring(0, 252) + "...");
        }
        if (item.getAllAttributes() != null && item.getAllAttributes().length() > 255) {
            item.setAllAttributes(item.getAllAttributes().substring(0, 252) + "...");
        }
        if (item.getLocation() != null && item.getLocation().length() > 255) {
            item.setLocation(item.getLocation().substring(0, 252) + "...");
        }
        if (item.getResponsible() != null && item.getResponsible().length() > 255) {
            item.setResponsible(item.getResponsible().substring(0, 252) + "...");
        }
        // Truncar valores en el mapa de atributos
        if (item.getAttributes() != null) {
            item.getAttributes().replaceAll((k, v) -> {
                if (v != null && v.length() > 255) {
                    return v.substring(0, 252) + "...";
                }
                return v;
            });
        }
    }
}