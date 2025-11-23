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

    @Override
    public AskForCancellationResponse askForCancellation(AskForCancellationRequest request) {
        List<ItemEntity> items = new ArrayList<>();
        request.itemsId().forEach(id -> {
            items.add(itemRepository.findById(id).orElseThrow(()->new RuntimeException("Item no encontrado")));
        });

        UserEntity requester = authService.getCurrentUser();

        CancellationEntity entity = new CancellationEntity();
        entity.setItems(items);
        entity.setRequester(requester);
        entity.setReason(request.reason());
        entity.setRequestedAt(LocalDateTime.now());

        CancellationEntity savedEntity = cancellationRepository.save(entity);

        return CancellationMapper.toResponse(savedEntity);
    }


    @Override
    public RefuseCancellationResponse refuseCancellation(RefuseCancellationRequest request) {
        CancellationEntity cancellation = cancellationRepository.getReferenceById(request.cancellationId());

        cancellation.setRefusedAt(LocalDateTime.now());
        cancellation.setComment(request.comment());
        cancellation.setChecker(authService.getCurrentUser());

        cancellationRepository.save(cancellation);

        return new RefuseCancellationResponse("Baja rechazada exitosamente");
    }

    @Override
    public AcceptCancellationResponse acceptCancellation(AcceptCancellationRequest request) {
        CancellationEntity cancellation = cancellationRepository.getReferenceById(request.cancellationId());

        cancellation.setApprovedAt(LocalDateTime.now());
        cancellation.setComment(request.comment());
        cancellation.setChecker(authService.getCurrentUser());

        cancellationRepository.save(cancellation);

        return new AcceptCancellationResponse("Baja aceptada exitosamente");
    }


    @Override
    @Transactional
    public String uploadFormat(Long cancellationId, MultipartFile file) throws IOException {
        CancellationEntity entity = cancellationRepository.getReferenceById(cancellationId);

        String path = fileUploadService.saveCancellationFormatFile(file, entity.getUuid());
        entity.setUrlFormat(path);

        cancellationRepository.save(entity);

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

        String path = fileUploadService.saveCancellationFormatExampleFile(file, entity.getUuid());
        entity.setUrlCorrectedExample(path);

        cancellationRepository.save(entity);

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
