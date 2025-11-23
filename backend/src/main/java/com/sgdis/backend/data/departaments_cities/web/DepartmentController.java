package com.sgdis.backend.data.departaments_cities.web;

import com.sgdis.backend.data.departaments_cities.dto.CityResponse;
import com.sgdis.backend.data.departaments_cities.dto.DepartmentResponse;
import com.sgdis.backend.data.departaments_cities.mapper.CityMapper;
import com.sgdis.backend.data.departaments_cities.mapper.DepartmentMapper;
import com.sgdis.backend.data.departaments_cities.repositories.SpringDataCitiesRepository;
import com.sgdis.backend.data.departaments_cities.repositories.SpringDataDepartamentsRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Department", description = "Department and cities management endpoints")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/departments")
public class DepartmentController {

    private final SpringDataCitiesRepository citiesRepository;
    private final SpringDataDepartamentsRepository departamentsRepository;

    @Operation(
            summary = "Get all departments",
            description = "Retrieves all departments"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Departments retrieved successfully"
    )
    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments() {
        List<DepartmentResponse> departments = DepartmentMapper.toResponse(
                departamentsRepository.findAll()
        );
        return ResponseEntity.ok(departments);
    }

    @Operation(
            summary = "Get cities by department",
            description = "Retrieves all cities for a specific department"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Cities retrieved successfully"
    )
    @ApiResponse(responseCode = "404", description = "Department not found")
    @GetMapping("/{departmentId}/cities")
    public ResponseEntity<List<CityResponse>> getCitiesByDepartment(
            @Parameter(description = "Department ID", required = true)
            @NotNull @PathVariable Long departmentId
    ) {
        List<CityResponse> cities = CityMapper.toResponse(
                citiesRepository.findByDepartamentId(departmentId)
        );
        return ResponseEntity.ok(cities);
    }
}

