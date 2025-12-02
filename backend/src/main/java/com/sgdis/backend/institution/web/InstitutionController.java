package com.sgdis.backend.institution.web;

import com.sgdis.backend.institution.application.dto.*;
import com.sgdis.backend.institution.application.port.in.CreateInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.GetAllInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.GetAllInstitutionsByRegionalIdUseCase;
import com.sgdis.backend.institution.application.port.in.GetByIdInstitutionUseCase;
import com.sgdis.backend.institution.application.port.in.UpdateInstitutionUseCase;
import com.sgdis.backend.institution.infrastructure.repository.SpringDataInstitutionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/institutions")
@Tag(name = "Institution", description = "Institution management endpoints")
//@SecurityRequirement(name = "bearerAuth")
public class InstitutionController {

    private final CreateInstitutionUseCase createInstitutionUseCase;
    private final GetAllInstitutionUseCase getAllInstitutionUseCase;
    private final GetAllInstitutionsByRegionalIdUseCase getAllInstitutionsByRegionalIdUseCase;
    private final GetByIdInstitutionUseCase getByIdInstitutionUseCase;
    private final UpdateInstitutionUseCase updateInstitutionUseCase;
    private final SpringDataInstitutionRepository institutionRepository;

    // Crear institución
    @Operation(
            summary = "Create new institution",
            description = "Creates a new institution",
            requestBody = @RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CreateInstitutionRequest.class),
                            examples = @ExampleObject(
                                    name = "CreateInstitutionRequest example",
                                    value = """
                                            {
                                              "name": "SENA",
                                              "regionalId": 1,
                                              "cityId": 1
                                            }
                                            """
                            )
                    )
            )
    )
    @ApiResponse(
            responseCode = "201",
            description = "Institution created successfully",
            content = @Content(schema = @Schema(implementation = InstitutionResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PostMapping("/add")
    public ResponseEntity<InstitutionResponse> createInstitution(
            @org.springframework.web.bind.annotation.RequestBody CreateInstitutionRequest request
    ) {
        var response = createInstitutionUseCase.createInstitution(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Obtener todas las instituciones
    @Operation(
            summary = "List all institutions",
            description = "Retrieves all institutions"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Institutions retrieved successfully",
            content = @Content(schema = @Schema(implementation = GetAllInstitutionResponse.class))
    )
    @GetMapping
    public ResponseEntity<List<GetAllInstitutionResponse>> getAllInstitutions() {
        var list = getAllInstitutionUseCase.getAllInstitution();
        return ResponseEntity.ok(list);
    }

    // Obtener institución por ID
    @Operation(
            summary = "Get institution by ID",
            description = "Retrieves a specific institution by its ID"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Institution found",
            content = @Content(schema = @Schema(implementation = GetByIdResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Institution not found")
    @GetMapping("/{id}")
    public ResponseEntity<GetByIdResponse> getInstitutionById(@PathVariable Long id) {
        var response = getByIdInstitutionUseCase.getById(id);
        return ResponseEntity.ok(response);
    }

    // Actualizar institución
    @Operation(
            summary = "Update institution",
            description = "Updates an existing institution",
            requestBody = @RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = UpdateInstitutionRequest.class),
                            examples = @ExampleObject(
                                    name = "UpdateInstitutionRequest example",
                                    value = """
                                            {
                                              "name": "SENA Bucaramanga",
                                              "regionalId": 7,
                                              "cityId": 456
                                            }
                                            """
                            )
                    )
            )
    )
    @ApiResponse(
            responseCode = "200",
            description = "Institution updated successfully",
            content = @Content(schema = @Schema(implementation = UpdateInstitutionResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Institution not found")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @PutMapping("/{id}")
    public ResponseEntity<UpdateInstitutionResponse> updateInstitution(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody UpdateInstitutionRequest request
    ) {
        var updated = updateInstitutionUseCase.updateInstitution(id, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/institutionsByRegionalId/{id}")
    public ResponseEntity<List<InstitutionResponseWithoutRegionalResponse>> getAllInstitutionsByRegionalId(@PathVariable Long id){
        List<InstitutionResponseWithoutRegionalResponse> list = getAllInstitutionsByRegionalIdUseCase.getAllInstitutionsByRegionalId(id);
        return ResponseEntity.ok(list);
    }

    @Operation(
            summary = "Get institutions for map",
            description = "Retrieves all institutions with their geographic coordinates for map visualization"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Institutions retrieved successfully",
            content = @Content(schema = @Schema(implementation = InstitutionMapResponse.class))
    )
    @GetMapping("/map")
    public ResponseEntity<List<InstitutionMapResponse>> getInstitutionsForMap() {
        var institutions = institutionRepository.findAll();
        var mapResponses = institutions.stream()
                .map(institution -> InstitutionMapResponse.builder()
                        .id(institution.getId())
                        .name(institution.getName())
                        .codeInstitution(institution.getCodeInstitution())
                        .latitude(institution.getLatitude())
                        .longitude(institution.getLongitude())
                        .cityName(institution.getCity() != null ? institution.getCity().getCity() : null)
                        .regionalName(institution.getRegional() != null ? institution.getRegional().getName() : null)
                        .regionalId(institution.getRegional() != null ? institution.getRegional().getId() : null)
                        .departamentName(institution.getRegional() != null && 
                                institution.getRegional().getDepartament() != null ? 
                                institution.getRegional().getDepartament().getDepartament() : null)
                        .build())
                .toList();
        return ResponseEntity.ok(mapResponses);
    }
}
