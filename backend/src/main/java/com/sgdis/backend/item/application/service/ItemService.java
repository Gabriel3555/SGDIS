package com.sgdis.backend.item.application.service;

import com.sgdis.backend.exception.DomainNotFoundException;
import com.sgdis.backend.exception.DomainConflictException;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.item.application.dto.*;
import com.sgdis.backend.loan.infrastructure.repository.SpringDataLoanRepository;
import com.sgdis.backend.loan.infrastructure.entity.LoanEntity;
import com.sgdis.backend.file.service.FileUploadService;
import java.io.IOException;
import java.util.List;
import com.sgdis.backend.item.application.port.CreateItemUseCase;
import com.sgdis.backend.item.application.port.DeleteItemUseCase;
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
// Auditoría
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService implements
        CreateItemUseCase,
        UpdateItemUseCase,
        DeleteItemUseCase,
        GetItemsByInventoryUseCase,
        GetItemByLicencePlateNumberUseCase,
        GetItemBySerialUseCase {

    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;
    private final SpringDataLoanRepository loanRepository;
    private final FileUploadService fileUploadService;
    private final RecordActionUseCase recordActionUseCase;

    @Override
    @Transactional
    public CreateItemResponse createItem(CreateItemRequest request) {
        if (request.licencePlateNumber() != null && !request.licencePlateNumber().trim().isEmpty()) {
            itemRepository.findByLicencePlateNumber(request.licencePlateNumber())
                    .ifPresent(existingItem -> {
                        throw new DomainConflictException(
                                "Ya existe un item con el número de placa: " + request.licencePlateNumber()
                        );
                    });
        }
        
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

        // Registrar auditoría
        String inventoryName = inventoryEntity.getName() != null ? inventoryEntity.getName() : "sin nombre";
        String itemName = itemEntity.getProductName() != null ? itemEntity.getProductName() : "sin nombre";
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Item creado: %s (ID: %d) - Inventario: %s (ID: %d)", 
                        itemName,
                        itemEntity.getId(),
                        inventoryName,
                        inventoryEntity.getId())
        ));

        return new CreateItemResponse(itemEntity.getProductName(), "Successfully created item");
    }

    @Override
    @Transactional
    public UpdateItemResponse updateItem(UpdateItemRequest request) {
        ItemEntity existingItem = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new DomainNotFoundException("Item not found with id: " + request.itemId()));

        // Guardar valores originales para auditoría
        String originalProductName = existingItem.getProductName();
        String originalLicencePlateNumber = existingItem.getLicencePlateNumber();
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

        // Registrar auditoría - construir descripción de cambios
        StringBuilder changes = new StringBuilder();
        if (request.productName() != null && !request.productName().equals(originalProductName)) {
            changes.append("Nombre actualizado | ");
        }
        if (request.licencePlateNumber() != null && !request.licencePlateNumber().equals(originalLicencePlateNumber)) {
            changes.append("Placa actualizada | ");
        }
        if (!oldAcquisitionValue.equals(newAcquisitionValue)) {
            changes.append("Valor de adquisición actualizado | ");
        }
        
        String changesDescription = changes.length() > 0 
                ? changes.toString().substring(0, changes.length() - 3) 
                : "Sin cambios";
        
        String itemName = updatedItem.getProductName() != null ? updatedItem.getProductName() : "sin nombre";
        String inventoryName = inventoryEntity != null && inventoryEntity.getName() != null ? inventoryEntity.getName() : "sin nombre";
        
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Item actualizado: %s (ID: %d) - Inventario: %s - %s", 
                        itemName,
                        updatedItem.getId(),
                        inventoryName,
                        changesDescription)
        ));

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

    @Override
    @Transactional
    public DeleteItemResponse deleteItem(Long itemId) {
        ItemEntity item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainNotFoundException("Item not found with id: " + itemId));

        // Check if item has active loans
        List<LoanEntity> activeLoans = loanRepository.findAllByItemId(itemId).stream()
                .filter(loan -> !Boolean.TRUE.equals(loan.getReturned()))
                .toList();

        if (!activeLoans.isEmpty()) {
            throw new IllegalStateException("Cannot delete item: Item has " + activeLoans.size() + " active loan(s)");
        }

        // Get inventory before deletion to update totalPrice
        InventoryEntity inventory = item.getInventory();
        Double acquisitionValue = item.getAcquisitionValue() != null ? item.getAcquisitionValue() : 0.0;

        // Delete associated images
        if (item.getUrlsImages() != null && !item.getUrlsImages().isEmpty()) {
            for (String imageUrl : item.getUrlsImages()) {
                try {
                    fileUploadService.deleteFile(imageUrl);
                } catch (IOException e) {
                    // Log error but continue with deletion
                    // The file might already be deleted or not exist
                }
            }
        }

        // Save item name before deletion
        String itemName = item.getProductName() != null ? item.getProductName() : "Item " + itemId;
        String inventoryName = inventory != null && inventory.getName() != null ? inventory.getName() : "sin nombre";
        Long inventoryId = inventory != null ? inventory.getId() : null;

        // Delete the item
        itemRepository.deleteById(itemId);

        // Update inventory totalPrice by subtracting the item's acquisitionValue
        if (inventory != null && acquisitionValue > 0) {
            Double currentTotal = inventory.getTotalPrice() != null ? inventory.getTotalPrice() : 0.0;
            Double updatedTotal = Math.max(0.0, currentTotal - acquisitionValue);
            inventory.setTotalPrice(updatedTotal);
            inventoryRepository.save(inventory);
        }

        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Item eliminado: %s (ID: %d) - Inventario: %s%s", 
                        itemName,
                        itemId,
                        inventoryName,
                        inventoryId != null ? " (ID: " + inventoryId + ")" : "")
        ));

        return new DeleteItemResponse(itemId, itemName, "Item deleted successfully");
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