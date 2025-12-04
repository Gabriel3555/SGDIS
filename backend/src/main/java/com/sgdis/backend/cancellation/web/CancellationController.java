package com.sgdis.backend.cancellation.web;

import com.sgdis.backend.cancellation.application.dto.AcceptCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.AcceptCancellationResponse;
import com.sgdis.backend.cancellation.application.dto.AskForCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.AskForCancellationResponse;
import com.sgdis.backend.cancellation.application.dto.CancellationResponse;
import com.sgdis.backend.cancellation.application.dto.CancellationStatisticsResponse;
import com.sgdis.backend.cancellation.application.dto.CancellationsByInventoryResponse;
import com.sgdis.backend.cancellation.application.dto.RefuseCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.RefuseCancellationResponse;
import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;
import com.sgdis.backend.cancellation.infrastructure.repository.SpringDataCancellationRepository;
import com.sgdis.backend.cancellation.mapper.CancellationMapper;
import com.sgdis.backend.cancellation.application.port.AcceptCancellationUseCase;
import com.sgdis.backend.cancellation.application.port.AskForCancellationUseCase;
import com.sgdis.backend.cancellation.application.port.DownloadCancellationFormatFileUseCase;
import com.sgdis.backend.cancellation.application.port.DownloadCancellationFormatExampleFileUseCase;
import com.sgdis.backend.cancellation.application.port.RefuseCancellationUseCase;
import com.sgdis.backend.cancellation.application.port.UploadFormatCancellationUseCase;
import com.sgdis.backend.cancellation.application.port.UploadFormatExampleCancellationUseCase;
import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/cancellations")
@Tag(name = "Cancellation", description = "Cancellation management endpoints")
public class CancellationController {

    private final AskForCancellationUseCase askForCancellationUseCase;
    private final AcceptCancellationUseCase acceptCancellationUseCase;
    private final RefuseCancellationUseCase refuseCancellationUseCase;
    private final UploadFormatCancellationUseCase uploadFormatCancellationUseCase;
    private final DownloadCancellationFormatFileUseCase downloadCancellationFormatFileUseCase;
    private final DownloadCancellationFormatExampleFileUseCase downloadCancellationFormatExampleFileUseCase;
    private final UploadFormatExampleCancellationUseCase uploadFormatExampleCancellationUseCase;
    private final SpringDataCancellationRepository cancellationRepository;
    private final AuthService authService;
    private final SpringDataUserRepository userRepository;

    @Operation(
            summary = "Get all cancellations",
            description = "Retrieves paginated cancellations (Superadmin, Admin Regional, Admin Institution)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Cancellations retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "403", description = "Access denied - Required role: SUPERADMIN, ADMIN_REGIONAL, or ADMIN_INSTITUTION")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION')")
    @GetMapping
    public ResponseEntity<Page<CancellationResponse>> getAllCancellations(
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
            
            // Get all cancellations with joins to load relationships
            long totalCount = cancellationRepository.count();
            List<CancellationEntity> allCancellations = cancellationRepository.findAllWithJoins();
            
            // Handle empty list
            if (allCancellations == null || allCancellations.isEmpty()) {
                Page<CancellationResponse> emptyPage = new PageImpl<>(List.of(), pageable, 0);
                return ResponseEntity.ok(emptyPage);
            }
            
            // Sort by ID descending (already sorted in query, but ensure it)
            allCancellations.sort((a, b) -> {
                if (a.getId() == null || b.getId() == null) {
                    return 0;
                }
                return Long.compare(b.getId(), a.getId());
            });
            
            // Apply pagination manually
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), allCancellations.size());
            
            List<CancellationEntity> paginatedCancellations;
            if (start >= allCancellations.size()) {
                paginatedCancellations = List.of();
            } else {
                paginatedCancellations = allCancellations.subList(start, end);
            }
            
            // Create Page manually
            Page<CancellationEntity> cancellationPage = new PageImpl<>(paginatedCancellations, pageable, totalCount);
            
            Page<CancellationResponse> responsePage = cancellationPage.map(CancellationMapper::toDto);
            
            return ResponseEntity.ok(responsePage);
        } catch (Exception e) {
            // Log error and return empty page
            System.err.println("Error fetching cancellations: " + e.getMessage());
            e.printStackTrace();
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
            Page<CancellationResponse> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            return ResponseEntity.ok(emptyPage);
        }
    }

    @Operation(
            summary = "Get cancellations by current user's institution",
            description = "Retrieves paginated cancellations for the current user's institution (Warehouse and Admin Institution)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Cancellations retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "403", description = "Access denied - WAREHOUSE or ADMIN_INSTITUTION role required")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN_INSTITUTION')")
    @GetMapping("/my-institution")
    public ResponseEntity<Page<CancellationResponse>> getCancellationsByMyInstitution(
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            // Get current warehouse user
            UserEntity currentUser = authService.getCurrentUser();
            Long userId = currentUser.getId();
            
            // Load user with institution to avoid LazyInitializationException
            UserEntity userWithInstitution = userRepository.findByIdWithInstitution(userId)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            // Get user's institution
            var userInstitution = userWithInstitution.getInstitution();
            if (userInstitution == null || userInstitution.getId() == null) {
                Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
                Page<CancellationResponse> emptyPage = new PageImpl<>(List.of(), pageable, 0);
                return ResponseEntity.ok(emptyPage);
            }
            
            Long institutionId = userInstitution.getId();
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
            
            // Use the repository method to get cancellations filtered by institution ID
            List<CancellationEntity> filteredCancellations = cancellationRepository.findAllByInstitutionIdWithJoins(institutionId);
            
            // Handle empty list
            if (filteredCancellations.isEmpty()) {
                Page<CancellationResponse> emptyPage = new PageImpl<>(List.of(), pageable, 0);
                return ResponseEntity.ok(emptyPage);
            }
            
            // Sort by ID descending (already sorted in query, but ensure it)
            filteredCancellations.sort((a, b) -> {
                if (a.getId() == null || b.getId() == null) {
                    return 0;
                }
                return Long.compare(b.getId(), a.getId());
            });
            
            // Apply pagination manually
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filteredCancellations.size());
            
            List<CancellationEntity> paginatedCancellations;
            if (start >= filteredCancellations.size()) {
                paginatedCancellations = List.of();
            } else {
                paginatedCancellations = filteredCancellations.subList(start, end);
            }
            
            // Create Page manually
            Page<CancellationEntity> cancellationPage = new PageImpl<>(paginatedCancellations, pageable, filteredCancellations.size());
            
            Page<CancellationResponse> responsePage = cancellationPage.map(CancellationMapper::toDto);
            
            return ResponseEntity.ok(responsePage);
        } catch (Exception e) {
            // Log error and return empty page
            System.err.println("Error fetching cancellations by institution: " + e.getMessage());
            e.printStackTrace();
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
            Page<CancellationResponse> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            return ResponseEntity.ok(emptyPage);
        }
    }

    @Operation(
            summary = "Get cancellation statistics for current user's institution",
            description = "Retrieves statistics about cancellations for the current user's institution (Warehouse only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Statistics retrieved successfully",
            content = @Content(schema = @Schema(implementation = CancellationStatisticsResponse.class))
    )
    @ApiResponse(responseCode = "403", description = "Access denied - WAREHOUSE role required")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @GetMapping("/my-institution/statistics")
    public ResponseEntity<CancellationStatisticsResponse> getCancellationStatisticsByMyInstitution() {
        try {
            // Get current warehouse user
            UserEntity currentUser = authService.getCurrentUser();
            Long userId = currentUser.getId();
            
            // Load user with institution to avoid LazyInitializationException
            UserEntity userWithInstitution = userRepository.findByIdWithInstitution(userId)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            // Get user's institution
            var userInstitution = userWithInstitution.getInstitution();
            if (userInstitution == null || userInstitution.getId() == null) {
                return ResponseEntity.ok(new CancellationStatisticsResponse(0L, 0L, 0L, 0L));
            }
            
            Long institutionId = userInstitution.getId();
            
            // Get all cancellations for this institution
            List<CancellationEntity> allCancellations = cancellationRepository.findAllByInstitutionIdWithJoins(institutionId);
            
            // Calculate statistics
            long total = allCancellations.size();
            long pending = allCancellations.stream()
                    .filter(c -> c.getApproved() == null || (!c.getApproved() && c.getRefusedAt() == null))
                    .count();
            long approved = allCancellations.stream()
                    .filter(c -> c.getApproved() != null && c.getApproved() && c.getRefusedAt() == null)
                    .count();
            long rejected = allCancellations.stream()
                    .filter(c -> c.getRefusedAt() != null)
                    .count();
            
            CancellationStatisticsResponse statistics = new CancellationStatisticsResponse(
                    total,
                    pending,
                    approved,
                    rejected
            );
            
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            // Log error and return empty statistics
            System.err.println("Error fetching cancellation statistics by institution: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new CancellationStatisticsResponse(0L, 0L, 0L, 0L));
        }
    }

    @Operation(
            summary = "Get cancellations by inventory for warehouse",
            description = "Retrieves count of approved cancellations grouped by inventory for the current warehouse user's institution"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Cancellations by inventory retrieved successfully",
            content = @Content(schema = @Schema(implementation = CancellationsByInventoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User institution not found")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @GetMapping("/warehouse/by-inventory")
    public ResponseEntity<CancellationsByInventoryResponse> getCancellationsByInventoryForWarehouse() {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            if (currentUser.getInstitution() == null || currentUser.getInstitution().getId() == null) {
                return ResponseEntity.ok(new CancellationsByInventoryResponse(java.util.Map.of()));
            }
            
            Long institutionId = currentUser.getInstitution().getId();
            List<Object[]> results = cancellationRepository.countCancellationsByInventoryForInstitution(institutionId);
            
            Map<String, Long> cancellationsByInventory = new HashMap<>();
            for (Object[] result : results) {
                String inventoryName = (String) result[0];
                Long count = ((Number) result[1]).longValue();
                cancellationsByInventory.put(inventoryName, count);
            }
            
            return ResponseEntity.ok(new CancellationsByInventoryResponse(cancellationsByInventory));
        } catch (Exception e) {
            System.err.println("Error fetching cancellations by inventory: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new CancellationsByInventoryResponse(java.util.Map.of()));
        }
    }

    @Operation(
            summary = "Ask for cancellation",
            description = "Submits a request to cancel an item",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = AskForCancellationRequest.class)
                    )
            )
    )
    @ApiResponse(
            responseCode = "201",
            description = "Cancellation request submitted successfully",
            content = @Content(schema = @Schema(implementation = AskForCancellationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/ask")
    public ResponseEntity<?> askForCancellation(
            @Valid @RequestBody AskForCancellationRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        try {
            // Verificar si hay token en el request
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
                errorResponse.put("status", HttpStatus.UNAUTHORIZED.value());
                errorResponse.put("error", "Unauthorized");
                errorResponse.put("message", "Token de autenticación requerido");
                errorResponse.put("detail", "Por favor, inicie sesión para realizar esta operación");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            
            var response = askForCancellationUseCase.askForCancellation(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            // Log the error
            System.err.println("Error in askForCancellation: " + e.getMessage());
            e.printStackTrace();
            
            // Return appropriate error response with JSON body
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            
            // Si es error de autenticación, retornar 401
            if (e.getMessage() != null && e.getMessage().contains("no autenticado")) {
                errorResponse.put("status", HttpStatus.UNAUTHORIZED.value());
                errorResponse.put("error", "Unauthorized");
                errorResponse.put("message", "Usuario no autenticado. Por favor, inicie sesión.");
                errorResponse.put("detail", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            
            errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            errorResponse.put("error", "Internal Server Error");
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Ha ocurrido un error inesperado");
            errorResponse.put("detail", e.getMessage() != null ? e.getMessage() : "Ha ocurrido un error inesperado");
            
            if (e.getMessage() != null && e.getMessage().contains("Item no encontrado")) {
                errorResponse.put("status", HttpStatus.NOT_FOUND.value());
                errorResponse.put("error", "Not Found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            
            // For other runtime exceptions, return 500
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (Exception e) {
            // Log the error
            System.err.println("Unexpected error in askForCancellation: " + e.getMessage());
            e.printStackTrace();
            
            // Return 500 for unexpected errors with JSON body
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
            errorResponse.put("error", "Internal Server Error");
            errorResponse.put("message", "Ha ocurrido un error inesperado");
            errorResponse.put("detail", e.getMessage() != null ? e.getMessage() : "Ha ocurrido un error inesperado");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @Operation(
            summary = "Download cancellation format file",
            description = "Downloads the format file for a specific cancellation"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Format file downloaded successfully"
    )
    @ApiResponse(responseCode = "404", description = "Cancellation or format file not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION')")
    @GetMapping("/{cancellationId}/download-format")
    public ResponseEntity<Resource> downloadFormatFile(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId
    ) {
        try {
            Resource resource = downloadCancellationFormatFileUseCase.downloadFormat(cancellationId);
            String filename = downloadCancellationFormatFileUseCase.getFilename(cancellationId);
            MediaType mediaType = downloadCancellationFormatFileUseCase.getMediaType(cancellationId);
            
            // Codificar el nombre del archivo para evitar problemas con caracteres especiales
            String encodedFilename = java.net.URLEncoder.encode(filename, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20"); // Reemplazar + con espacio codificado
            
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename)
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(
            summary = "Download cancellation format example file",
            description = "Downloads the format example file for a specific cancellation"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Format example file downloaded successfully"
    )
    @ApiResponse(responseCode = "404", description = "Cancellation or format example file not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION')")
    @GetMapping("/{cancellationId}/download-format-example")
    public ResponseEntity<Resource> downloadFormatExampleFile(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId
    ) {
        try {
            Resource resource = downloadCancellationFormatExampleFileUseCase.downloadFormatExample(cancellationId);
            String filename = downloadCancellationFormatExampleFileUseCase.getFilenameExample(cancellationId);
            MediaType mediaType = downloadCancellationFormatExampleFileUseCase.getMediaTypeExample(cancellationId);
            
            // Codificar el nombre del archivo para evitar problemas con caracteres especiales
            String encodedFilename = java.net.URLEncoder.encode(filename, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20"); // Reemplazar + con espacio codificado
            
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename)
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(
            summary = "Upload format example file",
            description = "Uploads a format example file for a specific cancellation"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Format example file uploaded successfully"
    )
    @ApiResponse(responseCode = "400", description = "Invalid file or request")
    @ApiResponse(responseCode = "404", description = "Cancellation not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION')")
    @PostMapping(value = "/{cancellationId}/upload-format-example", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadFormatExample(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId,
            @Parameter(
                    description = "Format example file",
                    required = true,
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")
                    )
            )
            @RequestPart("file") MultipartFile file
    ) {
        try {
            String message = uploadFormatExampleCancellationUseCase.uploadFormatExample(cancellationId, file);
            return ResponseEntity.ok(message);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al subir el archivo: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Cancelación no encontrada");
        }
    }

    @Operation(
            summary = "Accept cancellation",
            description = "Accepts a cancellation request with the provided comments"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Cancellation accepted successfully",
            content = @Content(schema = @Schema(implementation = AcceptCancellationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Cancellation not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION')")
    @PostMapping("/{cancellationId}/accept")
    public ResponseEntity<AcceptCancellationResponse> acceptCancellation(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId,
            @Valid @RequestBody RefuseCancellationRequest request
    ) {
        // Verify that the cancellationId in the path matches the one in the request
        if (!cancellationId.equals(request.cancellationId())) {
            return ResponseEntity.badRequest().build();
        }

        var acceptRequest = new AcceptCancellationRequest(cancellationId, request.comment());
        var response = acceptCancellationUseCase.acceptCancellation(acceptRequest);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Refuse cancellation",
            description = "Refuses a cancellation request with the provided comments"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Cancellation refused successfully",
            content = @Content(schema = @Schema(implementation = RefuseCancellationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Cancellation not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION')")
    @PostMapping("/{cancellationId}/refuse")
    public ResponseEntity<RefuseCancellationResponse> refuseCancellation(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId,
            @Valid @RequestBody RefuseCancellationRequest request
    ) {
        // Verify that the cancellationId in the path matches the one in the request
        if (!cancellationId.equals(request.cancellationId())) {
            return ResponseEntity.badRequest().build();
        }

        var response = refuseCancellationUseCase.refuseCancellation(request);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Upload cancellation format file",
            description = "Uploads a format file for a specific cancellation"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Format file uploaded successfully"
    )
    @ApiResponse(responseCode = "400", description = "Invalid file or request")
    @ApiResponse(responseCode = "404", description = "Cancellation not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION')")
    @PostMapping(value = "/{cancellationId}/upload-format", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadFormat(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId,
            @Parameter(
                    description = "Format file",
                    required = true,
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")
                    )
            )
            @RequestPart("file") MultipartFile file
    ) {
        try {
            String message = uploadFormatCancellationUseCase.uploadFormat(cancellationId, file);
            return ResponseEntity.ok(message);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al subir el archivo: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Cancelación no encontrada");
        }
    }

    @Operation(
            summary = "Download GIL-F-011 format template",
            description = "Downloads the GIL-F-011 format template (FORMATO CONCEPTO TÉCNICO DE BIENES)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Format template downloaded successfully"
    )
    @ApiResponse(responseCode = "404", description = "Format template file not found")
    @GetMapping("/download-format-template")
    public ResponseEntity<Resource> downloadFormatTemplate() {
        try {
            String filename = "GIL-F-011FormatoConceptoTecnicodeBienes.xlsx";
            // Usar la misma estrategia que FileUploadService para mantener consistencia
            Path rootLocation = Paths.get("uploads");
            Path formatsDir = rootLocation.resolve("cancellation").resolve("formats");
            Path filePath = formatsDir.resolve(filename);
            
            // Obtener la ruta absoluta para logging y verificación
            Path absolutePath = filePath.toAbsolutePath();
            
            // Verificar si el archivo existe en uploads
            if (!Files.exists(filePath)) {
                // Crear el directorio si no existe
                if (!Files.exists(formatsDir)) {
                    Files.createDirectories(formatsDir);
                }
                
                // Intentar copiar el archivo desde los recursos del JAR si existe
                try {
                    ClassPathResource classPathResource = new ClassPathResource("templates/" + filename);
                    if (classPathResource.exists()) {
                        try (InputStream inputStream = classPathResource.getInputStream()) {
                            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
                            System.out.println("Format template copied from JAR resources to: " + absolutePath);
                        }
                    } else {
                        // Si no está en templates/, intentar desde la raíz de recursos
                        ClassPathResource altResource = new ClassPathResource(filename);
                        if (altResource.exists()) {
                            try (InputStream inputStream = altResource.getInputStream()) {
                                Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
                                System.out.println("Format template copied from JAR resources to: " + absolutePath);
                            }
                        } else {
                            // Si tampoco existe en recursos, intentar servirlo directamente desde uploads del proyecto
                            // (útil para desarrollo local)
                            Path projectUploadsPath = Paths.get(System.getProperty("user.dir"), "uploads", "cancellation", "formats", filename);
                            if (Files.exists(projectUploadsPath)) {
                                Files.copy(projectUploadsPath, filePath, StandardCopyOption.REPLACE_EXISTING);
                                System.out.println("Format template copied from project directory to: " + absolutePath);
                            } else {
                                System.err.println("Format template file not found in any location. Searched:");
                                System.err.println("  - " + absolutePath);
                                System.err.println("  - classpath:templates/" + filename);
                                System.err.println("  - classpath:" + filename);
                                System.err.println("  - " + projectUploadsPath);
                                return ResponseEntity.notFound().build();
                            }
                        }
                    }
                } catch (IOException e) {
                    System.err.println("Error copying format template from resources: " + e.getMessage());
                    // Continuar para intentar servir desde recursos directamente
                }
            }
            
            // Intentar servir el archivo desde uploads
            Resource resource = new org.springframework.core.io.FileSystemResource(filePath);
            
            // Si el archivo en uploads no es legible, intentar servirlo directamente desde recursos
            if (!resource.exists() || !resource.isReadable()) {
                try {
                    ClassPathResource classPathResource = new ClassPathResource("templates/" + filename);
                    if (classPathResource.exists() && classPathResource.isReadable()) {
                        resource = classPathResource;
                        System.out.println("Serving format template directly from JAR resources");
                    } else {
                        ClassPathResource altResource = new ClassPathResource(filename);
                        if (altResource.exists() && altResource.isReadable()) {
                            resource = altResource;
                            System.out.println("Serving format template directly from JAR resources (root)");
                        } else {
                            System.err.println("Format template resource is not readable at: " + absolutePath);
                            return ResponseEntity.notFound().build();
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error accessing format template from resources: " + e.getMessage());
                    return ResponseEntity.notFound().build();
                }
            }
            
            // Codificar el nombre del archivo para evitar problemas con caracteres especiales
            String encodedFilename = java.net.URLEncoder.encode(filename, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");
            
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encodedFilename)
                    .body(resource);
        } catch (IOException e) {
            System.err.println("Error accessing format template file: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            System.err.println("Unexpected error downloading format template: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
