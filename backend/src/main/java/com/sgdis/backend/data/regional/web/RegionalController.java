package com.sgdis.backend.data.regional.web;

import com.sgdis.backend.data.regional.dto.RegionalMapResponse;
import com.sgdis.backend.data.regional.dto.RegionalResponse;
import com.sgdis.backend.data.regional.entity.RegionalEntity;
import com.sgdis.backend.data.regional.mapper.RegionalMapper;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
import com.sgdis.backend.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Regional")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/regional")
public class RegionalController {

    private final SpringDataRegionalRepository repository;

    @Operation(
            summary = "Get all regionals",
            description = "Retrieves all regionals with their department information"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Regionals retrieved successfully"
    )
    @GetMapping
    public List<RegionalResponse> getAllRegionals() {
        return RegionalMapper.toResponse(repository.findAll());
    }

    @Operation(
            summary = "Get regional by ID",
            description = "Retrieves a specific regional by its ID with department information"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Regional found"
    )
    @ApiResponse(
            responseCode = "404",
            description = "Regional not found"
    )
    @GetMapping("/{id}")
    public RegionalResponse getRegionalById(
            @Parameter(description = "Regional ID", required = true)
            @PathVariable Long id
    ) {
        RegionalEntity regional = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Regional not found with id: " + id));
        return RegionalMapper.toResponse(regional);
    }

    @Operation(
            summary = "Get regionals for map",
            description = "Retrieves all regionals with their geographic coordinates for map visualization"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Regionals retrieved successfully",
            content = @Content(schema = @Schema(implementation = RegionalMapResponse.class))
    )
    @GetMapping("/map")
    public ResponseEntity<List<RegionalMapResponse>> getRegionalsForMap() {
        var regionals = repository.findAll();
        var mapResponses = regionals.stream()
                .map(regional -> RegionalMapResponse.builder()
                        .id(regional.getId())
                        .name(regional.getName())
                        .regionalCode(regional.getRegionalCode())
                        .latitude(regional.getLatitude())
                        .longitude(regional.getLongitude())
                        .departamentName(regional.getDepartament() != null ? 
                                regional.getDepartament().getDepartament() : null)
                        .institutionsCount(regional.getInstitutions() != null ? 
                                regional.getInstitutions().size() : 0)
                        .build())
                .toList();
        return ResponseEntity.ok(mapResponses);
    }
}
