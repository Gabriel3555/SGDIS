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
    private final FileUploadService fileUploadService;
    private final AuthService authService;
    private final RecordActionUseCase recordActionUseCase;

    @Override
    @Transactional
    public AskForCancellationResponse askForCancellation(AskForCancellationRequest request) {
        try {
            List<ItemEntity> items = new ArrayList<>();
            request.itemsId().forEach(id -> {
                items.add(itemRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Item no encontrado con ID: " + id)));
            });

            UserEntity requester = authService.getCurrentUser();

            CancellationEntity entity = new CancellationEntity();
            entity.setItems(items);
            entity.setRequester(requester);
            entity.setReason(request.reason());
            entity.setRequestedAt(LocalDateTime.now());

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
                
                recordActionUseCase.recordAction(new RecordActionRequest(
                        String.format("Solicitud de baja creada: ID %d - Items: %s - Solicitado por: %s (%s) - Razón: %s", 
                                savedEntity.getId(),
                                itemsInfo.toString(),
                                requester.getFullName(),
                                requester.getEmail(),
                                request.reason() != null ? request.reason() : "N/A")
                ));
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
}
