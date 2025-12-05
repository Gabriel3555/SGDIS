package com.sgdis.backend.cancellation.application.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.cancellation.application.dto.*;
import com.sgdis.backend.cancellation.application.port.*;
import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;
import com.sgdis.backend.cancellation.infrastructure.repository.SpringDataCancellationRepository;
import com.sgdis.backend.cancellation.mapper.CancellationMapper;
import com.sgdis.backend.file.service.FileUploadService;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
// Notificaciones
import com.sgdis.backend.notification.service.NotificationService;
import com.sgdis.backend.notification.service.NotificationPersistenceService;
import com.sgdis.backend.notification.dto.NotificationMessage;
// Auditoría
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class CancellationService implements
        AskForCancellationUseCase,
        RefuseCancellationUseCase,
        AcceptCancellationUseCase,
        UploadFormatCancellationUseCase,
        DownloadCancellationFormatFileUseCase,
        DownloadCancellationFormatExampleFileUseCase,
        UploadFormatExampleCancellationUseCase{

    private final SpringDataCancellationRepository cancellationRepository;
    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;
    private final FileUploadService fileUploadService;
    private final AuthService authService;
    private final RecordActionUseCase recordActionUseCase;
    private final NotificationService notificationService;
    private final NotificationPersistenceService notificationPersistenceService;
    private final SpringDataUserRepository userRepository;

    @Override
    @Transactional
    public AskForCancellationResponse askForCancellation(AskForCancellationRequest request) {
        try {
            List<ItemEntity> items = new ArrayList<>();
            // Ensure all IDs are Long (handle potential String to Long conversion)
            for (Object idObj : request.itemsId()) {
                Long id;
                if (idObj instanceof Long) {
                    id = (Long) idObj;
                } else if (idObj instanceof String) {
                    try {
                        id = Long.parseLong((String) idObj);
                    } catch (NumberFormatException e) {
                        throw new RuntimeException("ID de item inválido: " + idObj);
                    }
                } else if (idObj instanceof Number) {
                    id = ((Number) idObj).longValue();
                } else {
                    throw new RuntimeException("Tipo de ID de item no soportado: " + idObj.getClass().getName());
                }
                items.add(itemRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Item no encontrado con ID: " + id)));
            }

            UserEntity requester = authService.getCurrentUser();

            for (ItemEntity item : items) {
                List<CancellationEntity> approvedCancellations = cancellationRepository.findApprovedCancellationsByItemId(item.getId());
                if (approvedCancellations != null && !approvedCancellations.isEmpty()) {
                    String itemName = item.getProductName() != null ? item.getProductName() : "Item ID " + item.getId();
                    String plateNumber = item.getLicencePlateNumber() != null ? " (Placa: " + item.getLicencePlateNumber() + ")" : "";
                    throw new RuntimeException("El item \"" + itemName + "\"" + plateNumber + " ya está dado de baja y no puede ser cancelado nuevamente.");
                }
            }

            validateCancellationPermissions(requester, items);

            CancellationEntity entity = new CancellationEntity();
            entity.setItems(items);
            entity.setRequester(requester);
            entity.setReason(request.reason());
            entity.setRequestedAt(LocalDateTime.now());

            if (requester.getRole() == Role.SUPERADMIN || 
                requester.getRole() == Role.ADMIN_REGIONAL || 
                requester.getRole() == Role.ADMIN_INSTITUTION ||
                requester.getRole() == Role.WAREHOUSE) {
                entity.setApprovedAt(LocalDateTime.now());
                entity.setApproved(true);
                entity.setChecker(requester);
                String roleName = requester.getRole().name();
                entity.setComment("Aprobación automática por " + roleName);
                
                // Restar valores del inventario cuando se aprueba automáticamente
                subtractInventoryValuesForCancellation(items);
            }

            CancellationEntity savedEntity = cancellationRepository.save(entity);

            try {
                int itemsCount = items != null ? items.size() : 0;
                String itemsInfo;
                if (itemsCount > 0) {
                    if (itemsCount <= 3) {
                        // Si hay 3 o menos items, mostrar todos
                        StringBuilder itemsBuilder = new StringBuilder();
                        items.forEach(item -> {
                            String itemName = item.getProductName() != null ? item.getProductName() : "sin nombre";
                            itemsBuilder.append(itemName).append(" (ID: ").append(item.getId()).append("), ");
                        });
                        if (itemsBuilder.length() > 0) {
                            itemsBuilder.setLength(itemsBuilder.length() - 2); // Remover última coma y espacio
                        }
                        itemsInfo = itemsBuilder.toString();
                    } else {
                        // Si hay más de 3 items, solo mostrar cantidad
                        itemsInfo = itemsCount + " items";
                    }
                } else {
                    itemsInfo = "N/A";
                }

                
                boolean isAutoApproved = requester.getRole() == Role.SUPERADMIN || 
                                        requester.getRole() == Role.ADMIN_REGIONAL || 
                                        requester.getRole() == Role.ADMIN_INSTITUTION ||
                                        requester.getRole() == Role.WAREHOUSE;
                
                String requesterName = requester.getFullName() != null ? requester.getFullName() : "Usuario";
                String requesterEmail = requester.getEmail() != null ? requester.getEmail() : "N/A";
                String roleName = requester.getRole() != null ? requester.getRole().name() : "N/A";
                String reason = request.reason() != null && !request.reason().isEmpty() 
                    ? (request.reason().length() > 50 ? request.reason().substring(0, 50) + "..." : request.reason())
                    : "N/A";
                
                String auditMessage = isAutoApproved
                        ? String.format("Baja creada y aprobada: ID %d - %s items - Por: %s (%s) - Rol: %s",
                                savedEntity.getId(),
                                itemsInfo,
                                requesterName,
                                requesterEmail,
                                roleName)
                        : String.format("Baja creada: ID %d - %s items - Por: %s (%s)",
                                savedEntity.getId(),
                                itemsInfo,
                                requesterName,
                                requesterEmail);
                
                if (auditMessage.length() > 250) {
                    auditMessage = auditMessage.substring(0, 247) + "...";
                }
                
                recordActionUseCase.recordAction(new RecordActionRequest(auditMessage));
            } catch (Exception auditException) {
                // Log audit error but don't fail the operation
                System.err.println("Error al registrar auditoría: " + auditException.getMessage());
                auditException.printStackTrace();
            }

            // Enviar notificaciones
            if (savedEntity.getApproved() != null && savedEntity.getApproved()) {
                // Si fue aprobada automáticamente, notificar como aprobada
                sendCancellationApprovedNotifications(savedEntity);
            } else {
                // Si está pendiente, notificar como solicitada
                sendCancellationRequestedNotifications(savedEntity);
            }

            return CancellationMapper.toResponse(savedEntity);
        } catch (Exception e) {
            System.err.println("Error en askForCancellation: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


    @Override
    public RefuseCancellationResponse refuseCancellation(RefuseCancellationRequest request) {
        CancellationEntity cancellation = cancellationRepository.getReferenceById(request.cancellationId());
        UserEntity checker = authService.getCurrentUser();
        String requesterName = cancellation.getRequester() != null ? cancellation.getRequester().getFullName() : "N/A";

        cancellation.setRefusedAt(LocalDateTime.now());
        cancellation.setComment(request.comment());
        cancellation.setChecker(checker);

        cancellationRepository.save(cancellation);

        // Registrar auditoría
        String checkerName = checker.getFullName() != null ? checker.getFullName() : "Usuario";
        String checkerEmail = checker.getEmail() != null ? checker.getEmail() : "N/A";
        String comment = request.comment() != null && !request.comment().isBlank() 
            ? (request.comment().length() > 30 ? request.comment().substring(0, 30) + "..." : request.comment())
            : "N/A";
        
        String auditMessage = String.format("Baja rechazada: ID %d - Por: %s (%s) - Solicitado: %s", 
                cancellation.getId(),
                checkerName,
                checkerEmail,
                requesterName);
        
        // Truncar a 250 caracteres
        if (auditMessage.length() > 250) {
            auditMessage = auditMessage.substring(0, 247) + "...";
        }
        
        recordActionUseCase.recordAction(new RecordActionRequest(auditMessage));

        // Enviar notificaciones
        sendCancellationRefusedNotifications(cancellation);

        return new RefuseCancellationResponse("Baja rechazada exitosamente");
    }

    @Override
    @Transactional
    public AcceptCancellationResponse acceptCancellation(AcceptCancellationRequest request) {
        CancellationEntity cancellation = cancellationRepository.getReferenceById(request.cancellationId());
        UserEntity checker = authService.getCurrentUser();
        String requesterName = cancellation.getRequester() != null ? cancellation.getRequester().getFullName() : "N/A";
        
        cancellation.setApprovedAt(LocalDateTime.now());
        cancellation.setApproved(true);
        cancellation.setComment(request.comment());
        cancellation.setChecker(checker);

        // Restar valores del inventario cuando se aprueba la cancelación
        List<ItemEntity> items = cancellation.getItems();
        if (items != null && !items.isEmpty()) {
            subtractInventoryValuesForCancellation(items);
        }

        cancellationRepository.save(cancellation);

        // Registrar auditoría
        int itemsCount = items != null ? items.size() : 0;
        String checkerName = checker.getFullName() != null ? checker.getFullName() : "Usuario";
        String checkerEmail = checker.getEmail() != null ? checker.getEmail() : "N/A";
        String comment = request.comment() != null && !request.comment().isBlank() 
            ? (request.comment().length() > 30 ? request.comment().substring(0, 30) + "..." : request.comment())
            : "N/A";
        
        String auditMessage = String.format("Baja aceptada: ID %d - %d items - Por: %s (%s) - Solicitado: %s", 
                cancellation.getId(),
                itemsCount,
                checkerName,
                checkerEmail,
                requesterName);
        
        // Truncar a 250 caracteres
        if (auditMessage.length() > 250) {
            auditMessage = auditMessage.substring(0, 247) + "...";
        }
        
        recordActionUseCase.recordAction(new RecordActionRequest(auditMessage));

        // Enviar notificaciones
        sendCancellationApprovedNotifications(cancellation);

        return new AcceptCancellationResponse("Baja aceptada exitosamente");
    }


    @Override
    @Transactional
    public String uploadFormat(Long cancellationId, MultipartFile file) throws IOException {
        CancellationEntity entity = cancellationRepository.getReferenceById(cancellationId);
        UserEntity currentUser = authService.getCurrentUser();
        String requesterName = entity.getRequester() != null ? entity.getRequester().getFullName() : "N/A";

        String path = fileUploadService.saveCancellationFormatFile(file, entity.getUuid());
        entity.setUrlFormat(path);

        cancellationRepository.save(entity);

        // Registrar auditoría
        String currentUserName = currentUser.getFullName() != null ? currentUser.getFullName() : "Usuario";
        String currentUserEmail = currentUser.getEmail() != null ? currentUser.getEmail() : "N/A";
        
        String auditMessage = String.format("Formato subido: ID %d - Por: %s (%s)", 
                cancellationId,
                currentUserName,
                currentUserEmail);
        
        // Truncar a 250 caracteres
        if (auditMessage.length() > 250) {
            auditMessage = auditMessage.substring(0, 247) + "...";
        }
        
        recordActionUseCase.recordAction(new RecordActionRequest(auditMessage));

        return "Formato subido correctamente";
    }

    @Override
    public Resource downloadFormat(Long cancellationId) {
        CancellationEntity entity = cancellationRepository.getReferenceById(cancellationId);
        
        if (entity.getUrlFormat() == null || entity.getUrlFormat().isEmpty()) {
            throw new RuntimeException("No format file found for cancellation with id: " + cancellationId);
        }

        String filename = entity.getUrlFormat().substring(entity.getUrlFormat().lastIndexOf("/") + 1);
        Path filePath = Paths.get("uploads", "cancellation", filename);
        
        if (!Files.exists(filePath)) {
            throw new RuntimeException("Format file not found on disk: " + filePath.toString());
        }
        
        return new FileSystemResource(filePath);
    }

    @Override
    public String getFilename(Long cancellationId) {
        CancellationEntity entity = cancellationRepository.getReferenceById(cancellationId);
        
        if (entity.getUrlFormat() == null || entity.getUrlFormat().isEmpty()) {
            throw new RuntimeException("No format file found for cancellation with id: " + cancellationId);
        }

        return entity.getUrlFormat().substring(entity.getUrlFormat().lastIndexOf("/") + 1);
    }

    @Override
    public MediaType getMediaType(Long cancellationId) {
        String filename = getFilename(cancellationId);
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        
        return switch (extension) {
            case "pdf" -> MediaType.APPLICATION_PDF;
            case "doc", "docx" -> MediaType.APPLICATION_OCTET_STREAM; // Word documents
            case "xls", "xlsx" -> MediaType.APPLICATION_OCTET_STREAM; // Excel files
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "png" -> MediaType.IMAGE_PNG;
            case "txt" -> MediaType.TEXT_PLAIN;
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }

    @Override
    @Transactional
    public String uploadFormatExample(Long cancellationId, MultipartFile file) throws IOException {
        CancellationEntity entity = cancellationRepository.getReferenceById(cancellationId);
        UserEntity currentUser = authService.getCurrentUser();
        String requesterName = entity.getRequester() != null ? entity.getRequester().getFullName() : "N/A";

        String path = fileUploadService.saveCancellationFormatExampleFile(file, entity.getUuid());
        entity.setUrlCorrectedExample(path);

        cancellationRepository.save(entity);

        // Registrar auditoría
        String currentUserName = currentUser.getFullName() != null ? currentUser.getFullName() : "Usuario";
        String currentUserEmail = currentUser.getEmail() != null ? currentUser.getEmail() : "N/A";
        
        String auditMessage = String.format("Ejemplo formato subido: ID %d - Por: %s (%s)", 
                cancellationId,
                currentUserName,
                currentUserEmail);
        
        // Truncar a 250 caracteres
        if (auditMessage.length() > 250) {
            auditMessage = auditMessage.substring(0, 247) + "...";
        }
        
        recordActionUseCase.recordAction(new RecordActionRequest(auditMessage));

        return "Formato subido correctamente";
    }

    @Override
    public Resource downloadFormatExample(Long cancellationId) {
        CancellationEntity entity = cancellationRepository.getReferenceById(cancellationId);
        
        if (entity.getUrlCorrectedExample() == null || entity.getUrlCorrectedExample().isEmpty()) {
            throw new RuntimeException("No format example file found for cancellation with id: " + cancellationId);
        }

        String filename = entity.getUrlCorrectedExample().substring(entity.getUrlCorrectedExample().lastIndexOf("/") + 1);
        Path filePath = Paths.get("uploads", "cancellation", filename);
        
        if (!Files.exists(filePath)) {
            throw new RuntimeException("Format example file not found on disk: " + filePath.toString());
        }
        
        return new FileSystemResource(filePath);
    }

    @Override
    public String getFilenameExample(Long cancellationId) {
        CancellationEntity entity = cancellationRepository.getReferenceById(cancellationId);
        
        if (entity.getUrlCorrectedExample() == null || entity.getUrlCorrectedExample().isEmpty()) {
            throw new RuntimeException("No format example file found for cancellation with id: " + cancellationId);
        }

        return entity.getUrlCorrectedExample().substring(entity.getUrlCorrectedExample().lastIndexOf("/") + 1);
    }

    @Override
    public MediaType getMediaTypeExample(Long cancellationId) {
        String filename = getFilenameExample(cancellationId);
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        
        return switch (extension) {
            case "pdf" -> MediaType.APPLICATION_PDF;
            case "doc", "docx" -> MediaType.APPLICATION_OCTET_STREAM; // Word documents
            case "xls", "xlsx" -> MediaType.APPLICATION_OCTET_STREAM; // Excel files
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "png" -> MediaType.IMAGE_PNG;
            case "txt" -> MediaType.TEXT_PLAIN;
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }

    /**
     * Valida los permisos para crear Bajas según el rol del usuario
     * @param requester Usuario que solicita la cancelación
     * @param items Lista de items a cancelar
     * @throws RuntimeException Si el usuario no tiene permisos para cancelar los items
     */
    private void validateCancellationPermissions(UserEntity requester, List<ItemEntity> items) {
        if (requester == null || items == null || items.isEmpty()) {
            return; // Las validaciones básicas ya se hacen en otros lugares
        }

        Role userRole = requester.getRole();
        
        // SUPERADMIN no tiene restricciones
        if (userRole == Role.SUPERADMIN) {
            return;
        }

        // ADMIN_REGIONAL no tiene restricciones (puede cancelar de cualquier regional)
        if (userRole == Role.ADMIN_REGIONAL) {
            return;
        }

        // ADMIN_INSTITUTION: Solo puede cancelar items de su propia institución y regional
        if (userRole == Role.ADMIN_INSTITUTION) {
            if (requester.getInstitution() == null) {
                throw new RuntimeException("El usuario ADMIN_INSTITUTION no tiene una institución asignada");
            }

            Long userInstitutionId = requester.getInstitution().getId();
            Long userRegionalId = requester.getInstitution().getRegional() != null 
                    ? requester.getInstitution().getRegional().getId() 
                    : null;

            if (userRegionalId == null) {
                throw new RuntimeException("La institución del usuario no tiene una regional asignada");
            }

            for (ItemEntity item : items) {
                if (item.getInventory() == null) {
                    throw new RuntimeException("El item con ID " + item.getId() + " no pertenece a ningún inventario");
                }

                if (item.getInventory().getInstitution() == null) {
                    throw new RuntimeException("El inventario del item con ID " + item.getId() + " no tiene una institución asignada");
                }

                Long itemInstitutionId = item.getInventory().getInstitution().getId();
                Long itemRegionalId = item.getInventory().getInstitution().getRegional() != null
                        ? item.getInventory().getInstitution().getRegional().getId()
                        : null;

                if (itemRegionalId == null) {
                    throw new RuntimeException("La institución del inventario del item con ID " + item.getId() + " no tiene una regional asignada");
                }

                // Validar que el item pertenezca a la misma institución
                if (!itemInstitutionId.equals(userInstitutionId)) {
                    String itemInstitutionName = item.getInventory().getInstitution().getName() != null
                            ? item.getInventory().getInstitution().getName()
                            : "sin nombre";
                    String userInstitutionName = requester.getInstitution().getName() != null
                            ? requester.getInstitution().getName()
                            : "sin nombre";
                    throw new RuntimeException(
                            String.format("No puedes cancelar items de otras instituciones. Item pertenece a: %s, Tu institución: %s",
                                    itemInstitutionName, userInstitutionName)
                    );
                }

                // Validar que el item pertenezca a la misma regional
                if (!itemRegionalId.equals(userRegionalId)) {
                    throw new RuntimeException("No puedes cancelar items de otras regionales. Solo puedes cancelar items de tu propia regional");
                }
            }
            return;
        }

        // WAREHOUSE: Solo puede cancelar items de su propia institución y regional
        if (userRole == Role.WAREHOUSE) {
            if (requester.getInstitution() == null) {
                throw new RuntimeException("El usuario WAREHOUSE no tiene una institución asignada");
            }

            Long userInstitutionId = requester.getInstitution().getId();
            Long userRegionalId = requester.getInstitution().getRegional() != null
                    ? requester.getInstitution().getRegional().getId()
                    : null;

            if (userRegionalId == null) {
                throw new RuntimeException("La institución del usuario WAREHOUSE no tiene una regional asignada");
            }

            for (ItemEntity item : items) {
                if (item.getInventory() == null) {
                    throw new RuntimeException("El item con ID " + item.getId() + " no pertenece a ningún inventario");
                }

                if (item.getInventory().getInstitution() == null) {
                    throw new RuntimeException("El inventario del item con ID " + item.getId() + " no tiene una institución asignada");
                }

                Long itemInstitutionId = item.getInventory().getInstitution().getId();
                Long itemRegionalId = item.getInventory().getInstitution().getRegional() != null
                        ? item.getInventory().getInstitution().getRegional().getId()
                        : null;

                if (itemRegionalId == null) {
                    throw new RuntimeException("La institución del inventario del item con ID " + item.getId() + " no tiene una regional asignada");
                }

                // Validar que el item pertenezca a la misma institución
                if (!itemInstitutionId.equals(userInstitutionId)) {
                    String itemInstitutionName = item.getInventory().getInstitution().getName() != null
                            ? item.getInventory().getInstitution().getName()
                            : "sin nombre";
                    String userInstitutionName = requester.getInstitution().getName() != null
                            ? requester.getInstitution().getName()
                            : "sin nombre";
                    throw new RuntimeException(
                            String.format("No puedes cancelar items de otras instituciones. Item pertenece a: %s, Tu institución: %s",
                                    itemInstitutionName, userInstitutionName)
                    );
                }

                // Validar que el item pertenezca a la misma regional
                if (!itemRegionalId.equals(userRegionalId)) {
                    throw new RuntimeException("No puedes cancelar items de otras regionales. Solo puedes cancelar items de tu propia regional");
                }
            }
            return;
        }

        // USER: Solo puede cancelar items de inventarios donde es owner o signatory (NO manager)
        if (userRole == Role.USER) {
            for (ItemEntity item : items) {
                if (item.getInventory() == null) {
                    throw new RuntimeException("El item con ID " + item.getId() + " no pertenece a ningún inventario");
                }
                
                InventoryEntity inventory = item.getInventory();
                
                // Verificar si el usuario es manager del inventario (NO permitido)
                if (inventory.getManagers() != null && inventory.getManagers().contains(requester)) {
                    String inventoryName = inventory.getName() != null ? inventory.getName() : "Inventario ID " + inventory.getId();
                    throw new RuntimeException(
                            String.format("Los manejadores no pueden solicitar bajas de items. Solo los propietarios y firmantes pueden solicitar bajas. Inventario: %s",
                                    inventoryName)
                    );
                }
                
                boolean isAuthorized = false;
                
                // Verificar si el usuario es owner del inventario
                if (inventory.getOwner() != null && inventory.getOwner().getId().equals(requester.getId())) {
                    isAuthorized = true;
                }
                
                // Verificar si el usuario es signatory del inventario
                if (!isAuthorized && inventory.getSignatories() != null && inventory.getSignatories().contains(requester)) {
                    isAuthorized = true;
                }
                
                if (!isAuthorized) {
                    String inventoryName = inventory.getName() != null ? inventory.getName() : "Inventario ID " + inventory.getId();
                    throw new RuntimeException(
                            String.format("No tienes permisos para solicitar bajas de items de este inventario. Solo puedes solicitar bajas de inventarios donde eres propietario o firmante. Inventario: %s",
                                    inventoryName)
                    );
                }
            }
            return;
        }
    }

    /**
     * Resta los valores de los items del inventario cuando se aprueba una cancelación.
     * Agrupa los items por inventario y resta el total de cada inventario.
     * 
     * @param items Lista de items a cancelar
     */
    private void subtractInventoryValuesForCancellation(List<ItemEntity> items) {
        if (items == null || items.isEmpty()) {
            return;
        }

        // Agrupar items por inventario y sumar sus valores
        java.util.Map<Long, Double> inventoryTotals = new java.util.HashMap<>();
        
        for (ItemEntity item : items) {
            if (item.getInventory() == null) {
                continue; // Skip items without inventory
            }
            
            Long inventoryId = item.getInventory().getId();
            Double itemValue = item.getAcquisitionValue();
            
            if (itemValue != null && itemValue > 0) {
                inventoryTotals.merge(inventoryId, itemValue, Double::sum);
            }
        }

        // Restar el total de cada inventario
        for (java.util.Map.Entry<Long, Double> entry : inventoryTotals.entrySet()) {
            Long inventoryId = entry.getKey();
            Double totalValue = entry.getValue();
            
            if (totalValue != null && totalValue > 0) {
                try {
                    inventoryRepository.subtractFromTotalPrice(inventoryId, totalValue);
                } catch (Exception e) {
                    // Log error but don't fail the cancellation
                    System.err.println("Error al restar valor del inventario " + inventoryId + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
    }

    /**
     * Envía notificaciones cuando se solicita una baja.
     * Se notifica a los mismos usuarios que cuando se crea un item.
     */
    private void sendCancellationRequestedNotifications(CancellationEntity cancellation) {
        try {
            log.info("Iniciando envío de notificación de solicitud de baja - Cancellation ID: {}", cancellation.getId());
            
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            log.debug("Usuario actual: {} (ID: {})", currentUser.getEmail(), currentUserId);
            
            List<ItemEntity> items = cancellation.getItems();
            if (items == null || items.isEmpty()) {
                log.warn("No hay items en la cancelación ID: {}. No se enviará notificación.", cancellation.getId());
                return;
            }
            
            // Obtener todos los inventarios únicos de los items
            Set<Long> inventoryIds = items.stream()
                    .filter(item -> item.getInventory() != null)
                    .map(item -> item.getInventory().getId())
                    .collect(Collectors.toSet());
            
            if (inventoryIds.isEmpty()) {
                log.warn("No se encontraron inventarios para los items de la cancelación ID: {}. No se enviará notificación.", cancellation.getId());
                return;
            }
            
            log.debug("Inventarios encontrados: {}", inventoryIds.size());
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin (solo una vez, independiente del inventario)
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            log.debug("Superadmins encontrados: {}", superadmins.size());
            
            // Para cada inventario, obtener los usuarios relacionados
            for (Long inventoryId : inventoryIds) {
                // Usar findByIdWithBasicRelations para evitar MultipleBagFetchException
                InventoryEntity inventory = inventoryRepository.findByIdWithBasicRelations(inventoryId).orElse(null);
                if (inventory == null) {
                    log.warn("No se encontró el inventario con ID: {}", inventoryId);
                    continue;
                }
                
                // 2. Admin regional de la misma regional del inventario
                if (inventory.getInstitution() != null && 
                    inventory.getInstitution().getRegional() != null) {
                    Long regionalId = inventory.getInstitution().getRegional().getId();
                    
                    List<UserEntity> adminRegionals = userRepository.findByRoleAndRegionalId(Role.ADMIN_REGIONAL, regionalId);
                    adminRegionals.forEach(admin -> userIdsToNotify.add(admin.getId()));
                    log.debug("Admin regionales encontrados: {} para regional ID: {}", adminRegionals.size(), regionalId);
                }
                
                // 3. Admin institution y warehouse de la misma institution del inventario
                if (inventory.getInstitution() != null) {
                    Long institutionId = inventory.getInstitution().getId();
                    
                    List<UserEntity> institutionUsers = userRepository.findByInstitutionIdAndRoles(
                            institutionId, Role.ADMIN_INSTITUTION, Role.WAREHOUSE);
                    institutionUsers.forEach(user -> userIdsToNotify.add(user.getId()));
                    log.debug("Usuarios de institución encontrados: {} para institución ID: {}", institutionUsers.size(), institutionId);
                }
                
                // 4. Dueño del inventario
                if (inventory.getOwner() != null) {
                    userIdsToNotify.add(inventory.getOwner().getId());
                    log.debug("Dueño del inventario: {} (ID: {})", inventory.getOwner().getEmail(), inventory.getOwner().getId());
                }
                
                // 5. Firmadores del inventario - cargar usando consulta separada
                List<UserEntity> signatories = inventoryRepository.findSignatoriesByInventoryId(inventoryId);
                signatories.forEach(signatory -> {
                    if (signatory != null && signatory.isStatus()) {
                        userIdsToNotify.add(signatory.getId());
                    }
                });
                log.debug("Firmadores encontrados: {} para inventario ID: {}", signatories.size(), inventoryId);
                
                // 6. Manejadores del inventario - cargar usando consulta separada
                List<UserEntity> managers = inventoryRepository.findManagersByInventoryId(inventoryId);
                managers.forEach(manager -> {
                    if (manager != null && manager.isStatus()) {
                        userIdsToNotify.add(manager.getId());
                    }
                });
                log.debug("Manejadores encontrados: {} para inventario ID: {}", managers.size(), inventoryId);
            }
            
            // Remover al usuario actual y al solicitante de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            if (cancellation.getRequester() != null) {
                userIdsToNotify.remove(cancellation.getRequester().getId());
            }
            
            log.info("Total de usuarios a notificar: {} (excluyendo usuario actual y solicitante)", userIdsToNotify.size());
            
            if (userIdsToNotify.isEmpty()) {
                log.warn("No hay usuarios para notificar sobre la solicitud de baja ID: {}", cancellation.getId());
                return;
            }
            
            // Preparar datos de la notificación
            int itemsCount = items.size();
            String requesterName = cancellation.getRequester() != null && cancellation.getRequester().getFullName() != null
                    ? cancellation.getRequester().getFullName()
                    : "Usuario";
            String message = String.format("Se ha solicitado una baja de %d item(s) por %s", itemsCount, requesterName);
            
            NotificationMessage notification = new NotificationMessage(
                    "CANCELLATION_REQUESTED",
                    "Baja Solicitada",
                    message,
                    new CancellationNotificationData(cancellation.getId(), itemsCount, requesterName, "REQUESTED")
            );
            
            log.debug("Mensaje de notificación preparado: {}", message);
            
            // Enviar notificaciones a todos los usuarios
            int notificationsSent = 0;
            int notificationsFailed = 0;
            for (Long userId : userIdsToNotify) {
                try {
                    notificationPersistenceService.saveNotification(
                            userId,
                            "CANCELLATION_REQUESTED",
                            "Baja Solicitada",
                            message,
                            new CancellationNotificationData(cancellation.getId(), itemsCount, requesterName, "REQUESTED")
                    );
                    notificationService.sendNotificationToUser(userId, notification);
                    notificationsSent++;
                } catch (Exception e) {
                    notificationsFailed++;
                    log.error("Error al enviar notificación de solicitud de baja al usuario {}: {}", userId, e.getMessage(), e);
                }
            }
            
            log.info("Notificación de solicitud de baja completada - Enviadas: {}, Fallidas: {}, Total usuarios: {}", 
                    notificationsSent, notificationsFailed, userIdsToNotify.size());
        } catch (Exception e) {
            log.error("Error al enviar notificación de solicitud de baja para cancelación ID {}: {}", 
                    cancellation.getId(), e.getMessage(), e);
            // El sistema de notificaciones no debe bloquear la operación
        }
    }

    /**
     * Envía notificaciones cuando se aprueba una baja.
     */
    private void sendCancellationApprovedNotifications(CancellationEntity cancellation) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            List<ItemEntity> items = cancellation.getItems();
            if (items == null || items.isEmpty()) {
                return;
            }
            
            // Obtener todos los inventarios únicos de los items
            Set<Long> inventoryIds = items.stream()
                    .filter(item -> item.getInventory() != null)
                    .map(item -> item.getInventory().getId())
                    .collect(Collectors.toSet());
            
            if (inventoryIds.isEmpty()) {
                return;
            }
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin (solo una vez, independiente del inventario)
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // Para cada inventario, obtener los usuarios relacionados
            for (Long inventoryId : inventoryIds) {
                // Usar findByIdWithBasicRelations para evitar MultipleBagFetchException
                InventoryEntity inventory = inventoryRepository.findByIdWithBasicRelations(inventoryId).orElse(null);
                if (inventory == null) {
                    log.warn("No se encontró el inventario con ID: {}", inventoryId);
                    continue;
                }
                
                // 2. Admin regional de la misma regional del inventario
                if (inventory.getInstitution() != null && 
                    inventory.getInstitution().getRegional() != null) {
                    Long regionalId = inventory.getInstitution().getRegional().getId();
                    
                    List<UserEntity> adminRegionals = userRepository.findByRoleAndRegionalId(Role.ADMIN_REGIONAL, regionalId);
                    adminRegionals.forEach(admin -> userIdsToNotify.add(admin.getId()));
                }
                
                // 3. Admin institution y warehouse de la misma institution del inventario
                if (inventory.getInstitution() != null) {
                    Long institutionId = inventory.getInstitution().getId();
                    
                    List<UserEntity> institutionUsers = userRepository.findByInstitutionIdAndRoles(
                            institutionId, Role.ADMIN_INSTITUTION, Role.WAREHOUSE);
                    institutionUsers.forEach(user -> userIdsToNotify.add(user.getId()));
                }
                
                // 4. Dueño del inventario
                if (inventory.getOwner() != null) {
                    userIdsToNotify.add(inventory.getOwner().getId());
                }
                
                // 5. Firmadores del inventario - cargar usando consulta separada
                List<UserEntity> signatories = inventoryRepository.findSignatoriesByInventoryId(inventoryId);
                signatories.forEach(signatory -> {
                    if (signatory != null && signatory.isStatus()) {
                        userIdsToNotify.add(signatory.getId());
                    }
                });
                
                // 6. Manejadores del inventario - cargar usando consulta separada
                List<UserEntity> managers = inventoryRepository.findManagersByInventoryId(inventoryId);
                managers.forEach(manager -> {
                    if (manager != null && manager.isStatus()) {
                        userIdsToNotify.add(manager.getId());
                    }
                });
            }
            
            // Remover al usuario actual de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            
            // Preparar datos de la notificación
            int itemsCount = items.size();
            String checkerName = cancellation.getChecker() != null && cancellation.getChecker().getFullName() != null
                    ? cancellation.getChecker().getFullName()
                    : "Usuario";
            String requesterName = cancellation.getRequester() != null && cancellation.getRequester().getFullName() != null
                    ? cancellation.getRequester().getFullName()
                    : "Usuario";
            
            // Notificación personalizada para el solicitante
            if (cancellation.getRequester() != null && !cancellation.getRequester().getId().equals(currentUserId)) {
                String personalMessage = String.format("Tu solicitud de baja de %d item(s) ha sido aprobada por %s", 
                        itemsCount, checkerName);
                
                NotificationMessage personalNotification = new NotificationMessage(
                        "CANCELLATION_APPROVED_PERSONAL",
                        "Tu Baja fue Aprobada",
                        personalMessage,
                        new CancellationNotificationData(cancellation.getId(), itemsCount, requesterName, "APPROVED")
                );
                
                try {
                    notificationPersistenceService.saveNotification(
                            cancellation.getRequester().getId(),
                            "CANCELLATION_APPROVED_PERSONAL",
                            "Tu Baja fue Aprobada",
                            personalMessage,
                            new CancellationNotificationData(cancellation.getId(), itemsCount, requesterName, "APPROVED")
                    );
                    notificationService.sendNotificationToUser(cancellation.getRequester().getId(), personalNotification);
                } catch (Exception e) {
                    // Log error pero continuar
                }
            }
            
            // Notificación informativa para los demás usuarios
            String message = String.format("Se ha aprobado una baja de %d item(s) por %s (Solicitado por: %s)", 
                    itemsCount, checkerName, requesterName);
            
            NotificationMessage notification = new NotificationMessage(
                    "CANCELLATION_APPROVED",
                    "Baja Aprobada",
                    message,
                    new CancellationNotificationData(cancellation.getId(), itemsCount, requesterName, "APPROVED")
            );
            
            // Enviar notificaciones a todos los usuarios (excluyendo al solicitante que ya recibió su notificación personalizada)
            if (cancellation.getRequester() != null) {
                userIdsToNotify.remove(cancellation.getRequester().getId());
            }
            for (Long userId : userIdsToNotify) {
                try {
                    notificationPersistenceService.saveNotification(
                            userId,
                            "CANCELLATION_APPROVED",
                            "Baja Aprobada",
                            message,
                            new CancellationNotificationData(cancellation.getId(), itemsCount, requesterName, "APPROVED")
                    );
                    notificationService.sendNotificationToUser(userId, notification);
                } catch (Exception e) {
                    // Log error pero continuar con otros usuarios
                }
            }
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }

    /**
     * Envía notificaciones cuando se rechaza una baja.
     */
    private void sendCancellationRefusedNotifications(CancellationEntity cancellation) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            List<ItemEntity> items = cancellation.getItems();
            if (items == null || items.isEmpty()) {
                return;
            }
            
            // Obtener todos los inventarios únicos de los items
            Set<Long> inventoryIds = items.stream()
                    .filter(item -> item.getInventory() != null)
                    .map(item -> item.getInventory().getId())
                    .collect(Collectors.toSet());
            
            if (inventoryIds.isEmpty()) {
                return;
            }
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin (solo una vez, independiente del inventario)
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // Para cada inventario, obtener los usuarios relacionados
            for (Long inventoryId : inventoryIds) {
                // Usar findByIdWithBasicRelations para evitar MultipleBagFetchException
                InventoryEntity inventory = inventoryRepository.findByIdWithBasicRelations(inventoryId).orElse(null);
                if (inventory == null) {
                    log.warn("No se encontró el inventario con ID: {}", inventoryId);
                    continue;
                }
                
                // 2. Admin regional de la misma regional del inventario
                if (inventory.getInstitution() != null && 
                    inventory.getInstitution().getRegional() != null) {
                    Long regionalId = inventory.getInstitution().getRegional().getId();
                    
                    List<UserEntity> adminRegionals = userRepository.findByRoleAndRegionalId(Role.ADMIN_REGIONAL, regionalId);
                    adminRegionals.forEach(admin -> userIdsToNotify.add(admin.getId()));
                }
                
                // 3. Admin institution y warehouse de la misma institution del inventario
                if (inventory.getInstitution() != null) {
                    Long institutionId = inventory.getInstitution().getId();
                    
                    List<UserEntity> institutionUsers = userRepository.findByInstitutionIdAndRoles(
                            institutionId, Role.ADMIN_INSTITUTION, Role.WAREHOUSE);
                    institutionUsers.forEach(user -> userIdsToNotify.add(user.getId()));
                }
                
                // 4. Dueño del inventario
                if (inventory.getOwner() != null) {
                    userIdsToNotify.add(inventory.getOwner().getId());
                }
                
                // 5. Firmadores del inventario - cargar usando consulta separada
                List<UserEntity> signatories = inventoryRepository.findSignatoriesByInventoryId(inventoryId);
                signatories.forEach(signatory -> {
                    if (signatory != null && signatory.isStatus()) {
                        userIdsToNotify.add(signatory.getId());
                    }
                });
                
                // 6. Manejadores del inventario - cargar usando consulta separada
                List<UserEntity> managers = inventoryRepository.findManagersByInventoryId(inventoryId);
                managers.forEach(manager -> {
                    if (manager != null && manager.isStatus()) {
                        userIdsToNotify.add(manager.getId());
                    }
                });
            }
            
            // Remover al usuario actual de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            
            // Preparar datos de la notificación
            int itemsCount = items.size();
            String checkerName = cancellation.getChecker() != null && cancellation.getChecker().getFullName() != null
                    ? cancellation.getChecker().getFullName()
                    : "Usuario";
            String requesterName = cancellation.getRequester() != null && cancellation.getRequester().getFullName() != null
                    ? cancellation.getRequester().getFullName()
                    : "Usuario";
            
            // Notificación personalizada para el solicitante
            if (cancellation.getRequester() != null && !cancellation.getRequester().getId().equals(currentUserId)) {
                String comment = cancellation.getComment() != null && !cancellation.getComment().trim().isEmpty()
                        ? cancellation.getComment()
                        : null;
                
                String personalMessage = comment != null
                        ? String.format("Tu solicitud de baja de %d item(s) ha sido rechazada por %s. Motivo: %s", 
                                itemsCount, checkerName, comment)
                        : String.format("Tu solicitud de baja de %d item(s) ha sido rechazada por %s", 
                                itemsCount, checkerName);
                
                NotificationMessage personalNotification = new NotificationMessage(
                        "CANCELLATION_REFUSED_PERSONAL",
                        "Tu Baja fue Rechazada",
                        personalMessage,
                        new CancellationNotificationData(cancellation.getId(), itemsCount, requesterName, "REFUSED")
                );
                
                try {
                    notificationPersistenceService.saveNotification(
                            cancellation.getRequester().getId(),
                            "CANCELLATION_REFUSED_PERSONAL",
                            "Tu Baja fue Rechazada",
                            personalMessage,
                            new CancellationNotificationData(cancellation.getId(), itemsCount, requesterName, "REFUSED")
                    );
                    notificationService.sendNotificationToUser(cancellation.getRequester().getId(), personalNotification);
                } catch (Exception e) {
                    // Log error pero continuar
                }
            }
            
            // Notificación informativa para los demás usuarios
            String message = String.format("Se ha rechazado una baja de %d item(s) por %s (Solicitado por: %s)", 
                    itemsCount, checkerName, requesterName);
            
            NotificationMessage notification = new NotificationMessage(
                    "CANCELLATION_REFUSED",
                    "Baja Rechazada",
                    message,
                    new CancellationNotificationData(cancellation.getId(), itemsCount, requesterName, "REFUSED")
            );
            
            // Enviar notificaciones a todos los usuarios (excluyendo al solicitante que ya recibió su notificación personalizada)
            if (cancellation.getRequester() != null) {
                userIdsToNotify.remove(cancellation.getRequester().getId());
            }
            for (Long userId : userIdsToNotify) {
                try {
                    notificationPersistenceService.saveNotification(
                            userId,
                            "CANCELLATION_REFUSED",
                            "Baja Rechazada",
                            message,
                            new CancellationNotificationData(cancellation.getId(), itemsCount, requesterName, "REFUSED")
                    );
                    notificationService.sendNotificationToUser(userId, notification);
                } catch (Exception e) {
                    // Log error pero continuar con otros usuarios
                }
            }
        } catch (Exception e) {
            // Log error pero no fallar la operación
        }
    }
    
    /**
     * DTO interno para datos de baja en la notificación
     */
    private record CancellationNotificationData(
            Long cancellationId,
            int itemsCount,
            String requesterName,
            String status
    ) {}
}
