package com.sgdis.backend.verification.web;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.file.service.FileUploadService;
import com.sgdis.backend.verification.application.dto.BatchVerificationItemRequest;
import com.sgdis.backend.verification.application.dto.CreateBatchVerificationResponse;
import com.sgdis.backend.verification.application.dto.CreateVerificationByLicencePlateNumberRequest;
import com.sgdis.backend.verification.application.dto.CreateVerificationBySerialRequest;
import com.sgdis.backend.verification.application.dto.CreateVerificationResponse;
import com.sgdis.backend.verification.application.dto.LatestVerificationResponse;
import com.sgdis.backend.verification.application.dto.UploadEvidenceResponse;
import com.sgdis.backend.verification.application.dto.VerificationResponse;
import com.sgdis.backend.verification.application.dto.VerificationStatisticsResponse;
import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.verification.application.port.in.CreateBatchVerificationUseCase;
import com.sgdis.backend.verification.application.port.in.CreateVerificationByLicencePlateNumberUseCase;
import com.sgdis.backend.verification.application.port.in.CreateVerificationBySerialUseCase;
import com.sgdis.backend.verification.application.port.in.GetLatestInventoryVerificationsUseCase;
import com.sgdis.backend.verification.application.port.in.GetVerificationsByItemUseCase;
import com.sgdis.backend.verification.infrastructure.entity.VerificationEntity;
import com.sgdis.backend.verification.infrastructure.repository.SpringDataVerificationRepository;
import com.sgdis.backend.verification.mapper.VerificationMapper;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/verifications")
@Tag(name = "Verification", description = "Verification management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class VerificationController {

    private final CreateVerificationBySerialUseCase createVerificationBySerialUseCase;
    private final CreateVerificationByLicencePlateNumberUseCase createVerificationByLicencePlateNumberUseCase;
    private final CreateBatchVerificationUseCase createBatchVerificationUseCase;
    private final GetVerificationsByItemUseCase getVerificationsByItemUseCase;
    private final GetLatestInventoryVerificationsUseCase getLatestInventoryVerificationsUseCase;
    private final SpringDataVerificationRepository verificationRepository;
    private final FileUploadService fileUploadService;
    private final AuthService authService;

    @Operation(
            summary = "Create verification by serial number",
            description = "Creates a new verification record for an item using its serial number. " +
                    "The user must be authorized to verify items from the item's inventory (owner, manager, or signatory).",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CreateVerificationBySerialRequest.class)
                    )
            )
    )
    @ApiResponse(
            responseCode = "201",
            description = "Verification created successfully",
            content = @Content(schema = @Schema(implementation = CreateVerificationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request or validation error")
    @ApiResponse(responseCode = "404", description = "Item not found with the provided serial number")
    @ApiResponse(responseCode = "403", description = "User not authorized to verify this item")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @PostMapping("/by-serial")
    public ResponseEntity<CreateVerificationResponse> createVerificationBySerial(
            @RequestBody @Valid CreateVerificationBySerialRequest request
    ) {
        CreateVerificationResponse response = createVerificationBySerialUseCase.createVerificationBySerial(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
            summary = "Create verification by licence plate number",
            description = "Creates a new verification record for an item using its licence plate number. " +
                    "The user must be authorized to verify items from the item's inventory (owner, manager, or signatory).",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CreateVerificationByLicencePlateNumberRequest.class)
                    )
            )
    )
    @ApiResponse(
            responseCode = "201",
            description = "Verification created successfully",
            content = @Content(schema = @Schema(implementation = CreateVerificationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request or validation error")
    @ApiResponse(responseCode = "404", description = "Item not found with the provided licence plate number")
    @ApiResponse(responseCode = "403", description = "User not authorized to verify this item")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @PostMapping("/by-licence-plate")
    public ResponseEntity<CreateVerificationResponse> createVerificationByLicencePlateNumber(
            @RequestBody @Valid CreateVerificationByLicencePlateNumberRequest request
    ) {
        CreateVerificationResponse response = createVerificationByLicencePlateNumberUseCase.createVerificationByLicencePlateNumber(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
            summary = "Get all verifications for an item",
            description = "Retrieves all verification records for a specific item, ordered by most recent first"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Verifications retrieved successfully",
            content = @Content(schema = @Schema(implementation = VerificationResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<VerificationResponse>> getVerificationsByItemId(
            @PathVariable Long itemId
    ) {
        List<VerificationResponse> verifications = getVerificationsByItemUseCase.getVerificationsByItemId(itemId);
        return ResponseEntity.ok(verifications);
    }

    @Operation(
            summary = "Get latest verifications for an inventory",
            description = "Retrieves the most recent verification records for all items within a specific inventory. " +
                    "Results are ordered from newest to oldest."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Latest verifications retrieved successfully",
            content = @Content(schema = @Schema(implementation = LatestVerificationResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Inventory not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/inventories/{inventoryId}/verifications/latest")
    public ResponseEntity<List<LatestVerificationResponse>> getLatestVerificationsByInventory(
            @PathVariable Long inventoryId,
            @RequestParam(name = "limit", required = false, defaultValue = "5") int limit
    ) {
        List<LatestVerificationResponse> latest = getLatestInventoryVerificationsUseCase
                .getLatestVerificationsByInventory(inventoryId, limit);
        return ResponseEntity.ok(latest);
    }

    @Operation(
            summary = "Create batch verifications by licence plate numbers",
            description = "Creates multiple verification records for items using their licence plate numbers. " +
                    "Each verification can include a photo. Only licence plates are accepted (not serials). " +
                    "The user must be authorized to verify items from the items' inventory (owner, manager, or signatory)."
    )
    @ApiResponse(
            responseCode = "201",
            description = "Batch verification completed (may have partial success)",
            content = @Content(schema = @Schema(implementation = CreateBatchVerificationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request or validation error")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @PostMapping(value = "/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CreateBatchVerificationResponse> createBatchVerification(
            @RequestPart("items") String itemsJson,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos
    ) {
        try {
            // Parse JSON array of licence plate numbers
            ObjectMapper objectMapper = new ObjectMapper();
            List<String> licencePlateNumbers = objectMapper.readValue(itemsJson, new TypeReference<List<String>>() {});
            
            if (licencePlateNumbers == null || licencePlateNumbers.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new CreateBatchVerificationResponse(
                                0, 0, 0, new ArrayList<>(),
                                "No items provided"
                        ));
            }

            // Crear lista de BatchVerificationItemRequest
            List<BatchVerificationItemRequest> items = new ArrayList<>();
            for (int i = 0; i < licencePlateNumbers.size(); i++) {
                String licencePlate = licencePlateNumbers.get(i);
                MultipartFile photo = null;
                
                // Get photo if available and not empty
                if (photos != null && i < photos.size()) {
                    MultipartFile photoFile = photos.get(i);
                    // Check if photo is not empty (empty blob check: size == 0 or original filename is "empty.jpg")
                    if (photoFile != null && 
                        photoFile.getSize() > 0 && 
                        (photoFile.getOriginalFilename() == null || !photoFile.getOriginalFilename().equals("empty.jpg"))) {
                        photo = photoFile;
                    }
                }
                
                items.add(new BatchVerificationItemRequest(licencePlate, photo));
            }

            CreateBatchVerificationResponse response = createBatchVerificationUseCase.createBatchVerification(items);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new CreateBatchVerificationResponse(
                            0, 0, 0, new ArrayList<>(),
                            "Error parsing request: " + e.getMessage()
                    ));
        }
    }

    @Operation(
            summary = "Upload evidence file for a verification",
            description = "Uploads an evidence file (photo or document) for a specific verification. " +
                    "Files are stored in uploads/verifications/{licencePlateNumber}/ directory and the generated URL is automatically appended to the verification record."
    )
    @ApiResponse(
            responseCode = "200",
            description = "File uploaded successfully and URL saved to database",
            content = @Content(schema = @Schema(implementation = UploadEvidenceResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Verification not found")
    @ApiResponse(responseCode = "400", description = "Invalid file")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @PostMapping(value = "/{verificationId}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadEvidenceResponse> uploadVerificationEvidence(
            @PathVariable Long verificationId,
            @Parameter(
                    description = "Evidence file (image, PDF, etc.)",
                    required = true,
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")
                    )
            )
            @RequestPart("file") MultipartFile file
    ) {
        try {
            VerificationEntity verification = verificationRepository.findById(verificationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Verification not found"));

            if (verification.getItem() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new UploadEvidenceResponse(
                                "Verification does not have an associated item",
                                null,
                                verificationId
                        ));
            }

            String licencePlateNumber = verification.getItem().getLicencePlateNumber();
            if (licencePlateNumber == null || licencePlateNumber.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new UploadEvidenceResponse(
                                "Item does not have a valid licence plate number",
                                null,
                                verificationId
                        ));
            }

            // Si ya hay una foto, eliminar la anterior antes de guardar la nueva
            if (verification.getPhotoUrl() != null && !verification.getPhotoUrl().isEmpty()) {
                try {
                    fileUploadService.deleteFile(verification.getPhotoUrl());
                } catch (IOException e) {
                    // Log error but continue with new upload
                }
            }

            // Guardar el archivo y obtener la URL (solo una foto por verificación)
            String fileUrl = fileUploadService.saveVerificationFile(
                    file,
                    licencePlateNumber,
                    verificationId,
                    0 // Solo una foto, siempre índice 0
            );

            // Guardar la URL de la foto en la base de datos
            verification.setPhotoUrl(fileUrl);
            verificationRepository.save(verification);

            return ResponseEntity.ok(new UploadEvidenceResponse(
                    "Evidence file uploaded successfully and URL saved to database",
                    fileUrl,
                    verificationId
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new UploadEvidenceResponse(
                            "Error uploading file: " + e.getMessage(),
                            null,
                            verificationId
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new UploadEvidenceResponse(
                            "Error: " + e.getMessage(),
                            null,
                            verificationId
                    ));
        }
    }

    @Operation(
            summary = "Download evidence file for a verification",
            description = "Downloads the evidence file associated with a specific verification"
    )
    @ApiResponse(
            responseCode = "200",
            description = "File downloaded successfully"
    )
    @ApiResponse(responseCode = "404", description = "Verification not found or file does not exist")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/{verificationId}/evidence")
    public ResponseEntity<Resource> downloadVerificationEvidence(
            @PathVariable Long verificationId
    ) {
        try {
            VerificationEntity verification = verificationRepository.findById(verificationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Verification not found"));

            if (verification.getPhotoUrl() == null || verification.getPhotoUrl().isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            String fileUrl = verification.getPhotoUrl();

            // Construir la ruta del archivo usando el mismo patrón que CancellationService
            Path filePath;
            if (fileUrl != null && fileUrl.startsWith("/uploads/")) {
                String relativePath = fileUrl.substring(9); // Remove "/uploads/" (9 characters)
                filePath = Paths.get("uploads").resolve(relativePath);
            } else if (fileUrl != null && fileUrl.startsWith("uploads/")) {
                filePath = Paths.get(fileUrl);
            } else {
                // Si no empieza con uploads, asumir que es relativo
                filePath = Paths.get("uploads").resolve(fileUrl != null ? fileUrl : "");
            }

            // Verificar que el archivo existe antes de crear el Resource
            if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
                // Log para debugging
                System.err.println("File not found or not readable: " + filePath.toAbsolutePath());
                System.err.println("File URL from DB: " + fileUrl);
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(filePath);

            String contentType = "application/octet-stream";
            String filename = filePath.getFileName().toString();
            if (filename.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (filename.endsWith(".png")) {
                contentType = "image/png";
            } else if (filename.endsWith(".doc")) {
                contentType = "application/msword";
            } else if (filename.endsWith(".docx")) {
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(
            summary = "Delete evidence file from a verification",
            description = "Deletes the evidence file from a verification"
    )
    @ApiResponse(
            responseCode = "200",
            description = "File deleted successfully"
    )
    @ApiResponse(responseCode = "404", description = "Verification not found or file not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @DeleteMapping("/{verificationId}/evidence")
    public ResponseEntity<String> deleteVerificationEvidence(
            @PathVariable Long verificationId
    ) {
        try {
            VerificationEntity verification = verificationRepository.findById(verificationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Verification not found"));

            if (verification.getPhotoUrl() == null || verification.getPhotoUrl().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Verification has no evidence file");
            }

            String fileUrl = verification.getPhotoUrl();

            // Eliminar archivo físico
            try {
                fileUploadService.deleteFile(fileUrl);
            } catch (IOException e) {
                // Log error but continue with removing from database
            }

            // Remover la URL de la foto
            verification.setPhotoUrl(null);
            verificationRepository.save(verification);

            return ResponseEntity.ok("Evidence file deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting file: " + e.getMessage());
        }
    }

    @Operation(
            summary = "Get all verifications with filters",
            description = "Retrieves paginated verifications with optional filters by regional, institution, or inventory (Superadmin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Verifications retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "403", description = "Access denied - SUPERADMIN role required")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @GetMapping
    public ResponseEntity<Page<VerificationResponse>> getAllVerifications(
            @Parameter(description = "Regional ID (optional)")
            @RequestParam(required = false) Long regionalId,
            @Parameter(description = "Institution ID (optional)")
            @RequestParam(required = false) Long institutionId,
            @Parameter(description = "Inventory ID (optional)")
            @RequestParam(required = false) Long inventoryId,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "6") int size
    ) {
        // Create pageable with sorting by ID descending (highest ID first)
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<VerificationEntity> verificationPage;
        
        if (inventoryId != null) {
            verificationPage = verificationRepository.findAllByInventoryId(inventoryId, pageable);
        } else if (institutionId != null) {
            verificationPage = verificationRepository.findAllByInstitutionId(institutionId, pageable);
        } else if (regionalId != null) {
            verificationPage = verificationRepository.findAllByRegionalId(regionalId, pageable);
        } else {
            // Get all verifications with JOIN FETCH to load relationships
            // First get total count
            long totalCount = verificationRepository.countAll();
            
            // Then get all verifications with JOIN FETCH
            List<VerificationEntity> allVerifications = verificationRepository.findAllWithJoins();
            
            // Apply pagination manually
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), allVerifications.size());
            List<VerificationEntity> paginatedVerifications = allVerifications.subList(start, end);
            
            // Create Page manually
            verificationPage = new PageImpl<>(paginatedVerifications, pageable, totalCount);
        }
        
        Page<VerificationResponse> responsePage = verificationPage.map(VerificationMapper::toDto);
        
        return ResponseEntity.ok(responsePage);
    }

    @Operation(
            summary = "Get verifications by regional",
            description = "Retrieves all verifications from inventories belonging to institutions in the specified regional with pagination"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Verifications retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "404", description = "Regional not found")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/regional/{regionalId}")
    public ResponseEntity<Page<VerificationResponse>> getVerificationsByRegional(
            @Parameter(description = "Regional ID", required = true)
            @PathVariable Long regionalId,
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<VerificationEntity> verificationPage = verificationRepository.findAllByRegionalId(regionalId, pageable);
        Page<VerificationResponse> responsePage = verificationPage.map(VerificationMapper::toDto);
        return ResponseEntity.ok(responsePage);
    }

    @Operation(
            summary = "Get regional verification statistics",
            description = "Retrieves total statistics of verifications in the current user's regional. " +
                    "The regional is obtained from the current user's institution."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Statistics retrieved successfully",
            content = @Content(schema = @Schema(implementation = VerificationStatisticsResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User institution or regional not found")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @GetMapping("/regional/statistics")
    public ResponseEntity<VerificationStatisticsResponse> getRegionalVerificationStatistics() {
        var currentUser = authService.getCurrentUser();
        if (currentUser.getInstitution() == null || currentUser.getInstitution().getRegional() == null) {
            throw new ResourceNotFoundException("User institution or regional not found");
        }
        Long regionalId = currentUser.getInstitution().getRegional().getId();
        
        Long total = verificationRepository.countByRegionalId(regionalId);
        Long completed = verificationRepository.countCompletedByRegionalId(regionalId);
        Long withEvidence = verificationRepository.countWithEvidenceByRegionalId(regionalId);
        
        VerificationStatisticsResponse statistics = new VerificationStatisticsResponse(
                total,
                completed,
                withEvidence
        );
        
        return ResponseEntity.ok(statistics);
    }

    @Operation(
            summary = "Get institution verification statistics",
            description = "Retrieves total statistics of verifications in the current user's institution. " +
                    "The institution is obtained from the current user."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Statistics retrieved successfully",
            content = @Content(schema = @Schema(implementation = VerificationStatisticsResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User institution not found")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @GetMapping("/institution/statistics")
    public ResponseEntity<VerificationStatisticsResponse> getInstitutionVerificationStatistics() {
        var currentUser = authService.getCurrentUser();
        if (currentUser.getInstitution() == null) {
            throw new ResourceNotFoundException("User institution not found");
        }
        Long institutionId = currentUser.getInstitution().getId();
        
        Long total = verificationRepository.countByInstitutionId(institutionId);
        // For completed and withEvidence, we use the same count since they're the same query
        Long completed = verificationRepository.countByInstitutionId(institutionId);
        Long withEvidence = verificationRepository.countByInstitutionId(institutionId);
        
        VerificationStatisticsResponse statistics = new VerificationStatisticsResponse(
                total,
                completed,
                withEvidence
        );
        
        return ResponseEntity.ok(statistics);
    }

    @Operation(
            summary = "Get recent verifications for institution",
            description = "Retrieves recent verifications for the current user's institution with pagination. " +
                    "The institution is obtained from the current user."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Recent verifications retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "404", description = "User institution not found")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @GetMapping("/institution/recent")
    public ResponseEntity<Page<LatestVerificationResponse>> getInstitutionRecentVerifications(
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "5") int size
    ) {
        var currentUser = authService.getCurrentUser();
        if (currentUser.getInstitution() == null) {
            throw new ResourceNotFoundException("User institution not found");
        }
        Long institutionId = currentUser.getInstitution().getId();
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<VerificationEntity> verificationPage = verificationRepository.findAllByInstitutionIdOrderedByCreatedAt(institutionId, pageable);
        
        List<LatestVerificationResponse> content = verificationPage.getContent().stream()
                .map(VerificationMapper::toLatestDto)
                .collect(java.util.stream.Collectors.toList());
        
        Page<LatestVerificationResponse> response = new PageImpl<>(
                content,
                pageable,
                verificationPage.getTotalElements()
        );
        
        return ResponseEntity.ok(response);
    }
}

