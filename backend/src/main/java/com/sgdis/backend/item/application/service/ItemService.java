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
import com.sgdis.backend.item.application.port.GetItemByIdUseCase;
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
// Notificaciones
import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.notification.service.NotificationService;
import com.sgdis.backend.notification.service.NotificationPersistenceService;
import com.sgdis.backend.notification.dto.NotificationMessage;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.verification.infrastructure.repository.SpringDataVerificationRepository;
import com.sgdis.backend.transfers.infrastructure.repository.SpringDataTransferRepository;
import com.sgdis.backend.transfers.infrastructure.entity.TransferEntity;
import com.sgdis.backend.cancellation.infrastructure.repository.SpringDataCancellationRepository;
import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;
import com.sgdis.backend.verification.infrastructure.entity.VerificationEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
@Slf4j
public class ItemService implements
        CreateItemUseCase,
        UpdateItemUseCase,
        DeleteItemUseCase,
        GetItemsByInventoryUseCase,
        GetItemByIdUseCase,
        GetItemByLicencePlateNumberUseCase,
        GetItemBySerialUseCase {

    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;
    private final SpringDataLoanRepository loanRepository;
    private final FileUploadService fileUploadService;
    private final RecordActionUseCase recordActionUseCase;
    private final AuthService authService;
    private final NotificationService notificationService;
    private final NotificationPersistenceService notificationPersistenceService;
    private final SpringDataUserRepository userRepository;
    private final SpringDataVerificationRepository verificationRepository;
    private final SpringDataTransferRepository transferRepository;
    private final SpringDataCancellationRepository cancellationRepository;
    
    // ThreadLocal para indicar si estamos en modo carga masiva
    private static final ThreadLocal<Boolean> BULK_UPLOAD_MODE = ThreadLocal.withInitial(() -> false);
    
    /**
     * Activa el modo de carga masiva para evitar notificaciones individuales
     */
    public static void setBulkUploadMode(boolean enabled) {
        BULK_UPLOAD_MODE.set(enabled);
    }
    
    /**
     * Verifica si estamos en modo de carga masiva
     */
    public static boolean isBulkUploadMode() {
        return BULK_UPLOAD_MODE.get();
    }
    
    /**
     * Limpia el modo de carga masiva
     */
    public static void clearBulkUploadMode() {
        BULK_UPLOAD_MODE.remove();
    }

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

        // Enviar notificaciones a los usuarios relacionados solo si NO estamos en modo carga masiva
        if (!isBulkUploadMode()) {
            sendItemCreatedNotifications(inventoryEntity, itemEntity);
        }

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
    public ItemDTO getItemById(Long itemId) {
        ItemEntity item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainNotFoundException("Item not found with id: " + itemId));
        return ItemMapper.toDTO(item);
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

        // Get inventory before deletion to update totalPrice
        InventoryEntity inventory = item.getInventory();
        Double acquisitionValue = item.getAcquisitionValue() != null ? item.getAcquisitionValue() : 0.0;

        // Save item name before deletion
        String itemName = item.getProductName() != null ? item.getProductName() : "Item " + itemId;
        String inventoryName = inventory != null && inventory.getName() != null ? inventory.getName() : "sin nombre";
        Long inventoryId = inventory != null ? inventory.getId() : null;

        // Eliminar en cascada todos los elementos relacionados
        
        // 1. Eliminar todos los préstamos (loans) relacionados
        List<LoanEntity> allLoans = loanRepository.findAllByItemId(itemId);
        if (!allLoans.isEmpty()) {
            loanRepository.deleteAll(allLoans);
        }

        // 2. Eliminar todas las verificaciones (verifications) relacionadas
        List<VerificationEntity> allVerifications = verificationRepository.findAllByItemIdOrderByCreatedAtDesc(itemId);
        if (!allVerifications.isEmpty()) {
            verificationRepository.deleteAll(allVerifications);
        }

        // 3. Eliminar todos los traslados (transfers) relacionados
        List<TransferEntity> allTransfers = transferRepository.findAllByItemId(itemId);
        if (!allTransfers.isEmpty()) {
            transferRepository.deleteAll(allTransfers);
        }

        // 4. Remover el item de todas las cancelaciones (cancellations) relacionadas
        // Como es una relación ManyToMany, primero eliminamos las relaciones de la tabla intermedia
        // y luego eliminamos las cancelaciones que queden sin items
        try {
            // Obtener todas las cancelaciones relacionadas antes de eliminar las relaciones
            List<CancellationEntity> allCancellations = cancellationRepository.findAllCancellationsByItemId(itemId);
            
            // Eliminar las relaciones de la tabla intermedia usando consulta nativa
            cancellationRepository.deleteItemFromCancellations(itemId);
            
            // Ahora verificar cuáles cancelaciones quedaron sin items y eliminarlas
            if (!allCancellations.isEmpty()) {
                for (CancellationEntity cancellation : allCancellations) {
                    try {
                        // Recargar la cancelación para verificar si tiene items
                        CancellationEntity reloadedCancellation = cancellationRepository.findById(cancellation.getId()).orElse(null);
                        if (reloadedCancellation != null && 
                            (reloadedCancellation.getItems() == null || reloadedCancellation.getItems().isEmpty())) {
                            // La cancelación quedó sin items, eliminarla
                            cancellationRepository.delete(reloadedCancellation);
                        }
                    } catch (Exception e) {
                        // Log error pero continuar
                        System.err.println("Error verificando cancelación " + cancellation.getId() + ": " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            // Log error pero continuar con la eliminación del item
            // No queremos que un error con las cancelaciones impida eliminar el item
            System.err.println("Error procesando cancelaciones para item " + itemId + ": " + e.getMessage());
            e.printStackTrace();
        }

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

        // Enviar notificaciones antes de eliminar el item (con manejo de errores)
        try {
            if (inventory != null) {
                sendItemDeletedNotifications(inventory, item);
            }
        } catch (Exception e) {
            // Log error pero continuar con la eliminación
            // No queremos que un error en las notificaciones impida eliminar el item
            System.err.println("Error enviando notificaciones para item " + itemId + ": " + e.getMessage());
        }

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

    /**
     * Envía notificaciones a todos los usuarios relacionados cuando se crea un item.
     * Se notifica a:
     * - Todos los superadmin
     * - Todos los admin regional de la misma regional del inventario
     * - Todos los admin institution de la misma institution del inventario
     * - Todos los warehouse de la misma institution del inventario
     * - El dueño del inventario
     * - Los firmadores del inventario
     * - Los manejadores del inventario
     * 
     * No se envía notificación al usuario que realiza la acción.
     */
    private void sendItemCreatedNotifications(InventoryEntity inventory, ItemEntity item) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
            InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                    .orElse(inventory);
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // 2. Admin regional de la misma regional del inventario
            if (fullInventory.getInstitution() != null && 
                fullInventory.getInstitution().getRegional() != null) {
                Long regionalId = fullInventory.getInstitution().getRegional().getId();
                
                List<UserEntity> adminRegionals = userRepository.findByRoleAndRegionalId(Role.ADMIN_REGIONAL, regionalId);
                adminRegionals.forEach(admin -> userIdsToNotify.add(admin.getId()));
            }
            
            // 3. Admin institution y warehouse de la misma institution del inventario
            if (fullInventory.getInstitution() != null) {
                Long institutionId = fullInventory.getInstitution().getId();
                
                List<UserEntity> institutionUsers = userRepository.findByInstitutionIdAndRoles(
                        institutionId, Role.ADMIN_INSTITUTION, Role.WAREHOUSE);
                institutionUsers.forEach(user -> userIdsToNotify.add(user.getId()));
            }
            
            // 4. Dueño del inventario
            if (fullInventory.getOwner() != null && fullInventory.getOwner().isStatus()) {
                userIdsToNotify.add(fullInventory.getOwner().getId());
            }
            
            // 5. Firmadores del inventario - cargar usando consulta separada
            List<UserEntity> signatories = inventoryRepository.findSignatoriesByInventoryId(inventory.getId());
            signatories.forEach(signatory -> {
                if (signatory != null && signatory.isStatus()) {
                    userIdsToNotify.add(signatory.getId());
                }
            });
            
            // 6. Manejadores del inventario - cargar usando consulta separada
            List<UserEntity> managers = inventoryRepository.findManagersByInventoryId(inventory.getId());
            managers.forEach(manager -> {
                if (manager != null && manager.isStatus()) {
                    userIdsToNotify.add(manager.getId());
                }
            });
            
            // Remover al usuario actual de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            
            // Preparar datos de la notificación
            String itemName = item.getProductName() != null ? item.getProductName() : "Item sin nombre";
            String inventoryName = fullInventory.getName() != null ? fullInventory.getName() : "Inventario sin nombre";
            String message = String.format("Se ha creado el item '%s' en el inventario '%s'", itemName, inventoryName);
            
            NotificationMessage notification = new NotificationMessage(
                    "ITEM_CREATED",
                    "Nuevo Item Creado",
                    message,
                    new ItemNotificationData(item.getId(), itemName, fullInventory.getId(), inventoryName)
            );
            
            // Enviar notificaciones a todos los usuarios
            for (Long userId : userIdsToNotify) {
                try {
                    // Guardar en base de datos
                    notificationPersistenceService.saveNotification(
                            userId,
                            "ITEM_CREATED",
                            "Nuevo Item Creado",
                            message,
                            new ItemNotificationData(item.getId(), itemName, fullInventory.getId(), inventoryName)
                    );
                    
                    // Enviar por WebSocket
                    notificationService.sendNotificationToUser(userId, notification);
                } catch (Exception e) {
                    // Log error pero continuar con otros usuarios
                    // El log se maneja en NotificationService
                }
            }
        } catch (Exception e) {
            // Log error pero no fallar la creación del item
            // El sistema de notificaciones no debe bloquear la creación
        }
    }
    
    /**
     * Envía notificaciones a todos los usuarios relacionados cuando se elimina un item.
     * Se notifica a los mismos usuarios que cuando se crea un item.
     * No se envía notificación al usuario que realiza la acción.
     */
    private void sendItemDeletedNotifications(InventoryEntity inventory, ItemEntity item) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            // Cargar el inventario con relaciones básicas (sin las colecciones problemáticas)
            InventoryEntity fullInventory = inventoryRepository.findByIdWithBasicRelations(inventory.getId())
                    .orElse(inventory);
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // 2. Admin regional de la misma regional del inventario
            if (fullInventory.getInstitution() != null && 
                fullInventory.getInstitution().getRegional() != null) {
                Long regionalId = fullInventory.getInstitution().getRegional().getId();
                
                List<UserEntity> adminRegionals = userRepository.findByRoleAndRegionalId(Role.ADMIN_REGIONAL, regionalId);
                adminRegionals.forEach(admin -> userIdsToNotify.add(admin.getId()));
            }
            
            // 3. Admin institution y warehouse de la misma institution del inventario
            if (fullInventory.getInstitution() != null) {
                Long institutionId = fullInventory.getInstitution().getId();
                
                List<UserEntity> institutionUsers = userRepository.findByInstitutionIdAndRoles(
                        institutionId, Role.ADMIN_INSTITUTION, Role.WAREHOUSE);
                institutionUsers.forEach(user -> userIdsToNotify.add(user.getId()));
            }
            
            // 4. Dueño del inventario
            if (fullInventory.getOwner() != null && fullInventory.getOwner().isStatus()) {
                userIdsToNotify.add(fullInventory.getOwner().getId());
            }
            
            // 5. Firmadores del inventario - cargar usando consulta separada
            List<UserEntity> signatories = inventoryRepository.findSignatoriesByInventoryId(inventory.getId());
            signatories.forEach(signatory -> {
                if (signatory != null && signatory.isStatus()) {
                    userIdsToNotify.add(signatory.getId());
                }
            });
            
            // 6. Manejadores del inventario - cargar usando consulta separada
            List<UserEntity> managers = inventoryRepository.findManagersByInventoryId(inventory.getId());
            managers.forEach(manager -> {
                if (manager != null && manager.isStatus()) {
                    userIdsToNotify.add(manager.getId());
                }
            });
            
            // Remover al usuario actual de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            
            // Preparar datos de la notificación
            String itemName = item.getProductName() != null ? item.getProductName() : "Item sin nombre";
            String inventoryName = fullInventory.getName() != null ? fullInventory.getName() : "Inventario sin nombre";
            String message = String.format("Se ha eliminado el item '%s' del inventario '%s'", itemName, inventoryName);
            
            NotificationMessage notification = new NotificationMessage(
                    "ITEM_DELETED",
                    "Item Eliminado",
                    message,
                    new ItemNotificationData(item.getId(), itemName, fullInventory.getId(), inventoryName)
            );
            
            // Enviar notificaciones a todos los usuarios
            for (Long userId : userIdsToNotify) {
                try {
                    // Guardar en base de datos
                    notificationPersistenceService.saveNotification(
                            userId,
                            "ITEM_DELETED",
                            "Item Eliminado",
                            message,
                            new ItemNotificationData(item.getId(), itemName, fullInventory.getId(), inventoryName)
                    );
                    
                    // Enviar por WebSocket
                    notificationService.sendNotificationToUser(userId, notification);
                } catch (Exception e) {
                    // Log error pero continuar con otros usuarios
                    // El log se maneja en NotificationService
                }
            }
        } catch (Exception e) {
            // Log error pero no fallar la eliminación del item
            // El sistema de notificaciones no debe bloquear la eliminación
        }
    }
    
    /**
     * DTO interno para datos del item en la notificación
     */
    private record ItemNotificationData(
            Long itemId,
            String itemName,
            Long inventoryId,
            String inventoryName
    ) {}
}