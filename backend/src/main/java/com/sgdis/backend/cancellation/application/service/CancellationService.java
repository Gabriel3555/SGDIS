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
// Auditoría
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
import lombok.AllArgsConstructor;
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

@Service
@AllArgsConstructor
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

            // Validaciones según el rol del usuario
            validateCancellationPermissions(requester, items);

            CancellationEntity entity = new CancellationEntity();
            entity.setItems(items);
            entity.setRequester(requester);
            entity.setReason(request.reason());
            entity.setRequestedAt(LocalDateTime.now());

            // Si el usuario es SUPERADMIN, ADMIN_REGIONAL, ADMIN_INSTITUTION o WAREHOUSE, aprobar automáticamente la cancelación
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

            // Registrar auditoría (no crítico si falla, pero intentamos registrarlo)
            try {
                StringBuilder itemsInfo = new StringBuilder();
                if (items != null && !items.isEmpty()) {
                    items.forEach(item -> {
                        String itemName = item.getProductName() != null ? item.getProductName() : "sin nombre";
                        itemsInfo.append(itemName).append(" (ID: ").append(item.getId()).append("), ");
                    });
                    if (itemsInfo.length() > 0) {
                        itemsInfo.setLength(itemsInfo.length() - 2); // Remover última coma y espacio
                    }
                } else {
                    itemsInfo.append("N/A");
                }
                
                boolean isAutoApproved = requester.getRole() == Role.SUPERADMIN || 
                                        requester.getRole() == Role.ADMIN_REGIONAL || 
                                        requester.getRole() == Role.ADMIN_INSTITUTION ||
                                        requester.getRole() == Role.WAREHOUSE;
                
                String auditMessage = isAutoApproved
                        ? String.format("Solicitud de baja creada y aprobada automáticamente: ID %d - Items: %s - Solicitado/Aprobado por: %s (%s) - Rol: %s - Razón: %s",
                                savedEntity.getId(),
                                itemsInfo.toString(),
                                requester.getFullName(),
                                requester.getEmail(),
                                requester.getRole().name(),
                                request.reason() != null ? request.reason() : "N/A")
                        : String.format("Solicitud de baja creada: ID %d - Items: %s - Solicitado por: %s (%s) - Razón: %s",
                                savedEntity.getId(),
                                itemsInfo.toString(),
                                requester.getFullName(),
                                requester.getEmail(),
                                request.reason() != null ? request.reason() : "N/A");
                
                recordActionUseCase.recordAction(new RecordActionRequest(auditMessage));
            } catch (Exception auditException) {
                // Log audit error but don't fail the operation
                System.err.println("Error al registrar auditoría: " + auditException.getMessage());
                auditException.printStackTrace();
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
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Baja rechazada: ID %d - Rechazado por: %s (%s) - Solicitado por: %s - Comentario: %s", 
                        cancellation.getId(),
                        checker.getFullName(),
                        checker.getEmail(),
                        requesterName,
                        request.comment() != null && !request.comment().isBlank() ? request.comment() : "N/A")
        ));

        return new RefuseCancellationResponse("Baja rechazada exitosamente");
    }

    @Override
    @Transactional
    public AcceptCancellationResponse acceptCancellation(AcceptCancellationRequest request) {
        CancellationEntity cancellation = cancellationRepository.getReferenceById(request.cancellationId());
        UserEntity checker = authService.getCurrentUser();
        String requesterName = cancellation.getRequester() != null ? cancellation.getRequester().getFullName() : "N/A";
        
        // Obtener información de items antes de guardar
        StringBuilder itemsInfo = new StringBuilder();
        if (cancellation.getItems() != null && !cancellation.getItems().isEmpty()) {
            cancellation.getItems().forEach(item -> {
                String itemName = item.getProductName() != null ? item.getProductName() : "sin nombre";
                itemsInfo.append(itemName).append(" (ID: ").append(item.getId()).append("), ");
            });
            if (itemsInfo.length() > 0) {
                itemsInfo.setLength(itemsInfo.length() - 2); // Remover última coma y espacio
            }
        } else {
            itemsInfo.append("N/A");
        }

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
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Baja aceptada: ID %d - Items: %s - Aceptado por: %s (%s) - Solicitado por: %s - Comentario: %s", 
                        cancellation.getId(),
                        itemsInfo.toString(),
                        checker.getFullName(),
                        checker.getEmail(),
                        requesterName,
                        request.comment() != null && !request.comment().isBlank() ? request.comment() : "N/A")
        ));

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
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Formato de baja subido: ID %d - Subido por: %s (%s) - Solicitado por: %s", 
                        cancellationId,
                        currentUser.getFullName(),
                        currentUser.getEmail(),
                        requesterName)
        ));

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
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Formato de ejemplo de baja subido: ID %d - Subido por: %s (%s) - Solicitado por: %s", 
                        cancellationId,
                        currentUser.getFullName(),
                        currentUser.getEmail(),
                        requesterName)
        ));

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
     * Valida los permisos para crear cancelaciones según el rol del usuario
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

        // USER: No tiene restricciones de validación, pero no se aprueba automáticamente
        // (ya está manejado en el código principal)
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
}
