package com.sgdis.backend.item.application.service;

import com.sgdis.backend.exception.DomainNotFoundException;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.item.application.dto.*;
import com.sgdis.backend.item.application.port.CreateItemUseCase;
import com.sgdis.backend.item.application.port.GetItemByLicencePlateNumberUseCase;
import com.sgdis.backend.item.application.port.GetItemBySerialUseCase;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService implements
        CreateItemUseCase,
        UpdateItemUseCase,
        GetItemsByInventoryUseCase,
        GetItemByLicencePlateNumberUseCase,
        GetItemBySerialUseCase {

    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;

    @Override
    @Transactional
    public CreateItemResponse createItem(CreateItemRequest request) {
        ItemEntity itemEntity = ItemMapper.toEntity(request);
        InventoryEntity inventoryEntity = inventoryRepository.getReferenceById(request.inventoryId());

        List<ItemEntity> itemEntityList = inventoryEntity.getItems();
        itemEntityList.add(itemEntity);

        inventoryEntity.setItems(itemEntityList);
        itemEntity.setInventory(inventoryEntity);
        
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

        // Actualizar totalPrice del inventario al agregar el item
        if (request.acquisitionValue() != null && request.acquisitionValue() > 0) {
            Double currentTotal = inventoryEntity.getTotalPrice() != null ? inventoryEntity.getTotalPrice() : 0.0;
            inventoryEntity.setTotalPrice(currentTotal + request.acquisitionValue());
        }

        inventoryRepository.save(inventoryEntity);
        itemRepository.save(itemEntity);

        return new CreateItemResponse(itemEntity.getProductName(), "Successfully created item");
    }

    @Override
    @Transactional
    public UpdateItemResponse updateItem(UpdateItemRequest request) {
        ItemEntity existingItem = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new DomainNotFoundException("Item not found with id: " + request.itemId()));

        // Guardar el valor anterior de acquisitionValue para actualizar el totalPrice del inventario
        Double oldAcquisitionValue = existingItem.getAcquisitionValue() != null ? existingItem.getAcquisitionValue() : 0.0;
        Double newAcquisitionValue = request.acquisitionValue() != null ? request.acquisitionValue() : 0.0;

        // Obtener el inventario antes de actualizar el item (cargar la relación LAZY)
        InventoryEntity inventoryEntity = existingItem.getInventory();
        
        ItemEntity updatedItem = ItemMapper.toEntity(request, existingItem);
        
        // Actualizar totalPrice del inventario si cambió el acquisitionValue
        if (inventoryEntity != null && !oldAcquisitionValue.equals(newAcquisitionValue)) {
            Double currentTotal = inventoryEntity.getTotalPrice() != null ? inventoryEntity.getTotalPrice() : 0.0;
            // Restar el valor anterior y sumar el nuevo
            Double updatedTotal = currentTotal - oldAcquisitionValue + newAcquisitionValue;
            // Asegurar que el total no sea negativo
            inventoryEntity.setTotalPrice(Math.max(0.0, updatedTotal));
            inventoryRepository.save(inventoryEntity);
        }
        
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