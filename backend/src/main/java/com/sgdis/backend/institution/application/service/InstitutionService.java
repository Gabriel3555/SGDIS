package com.sgdis.backend.institution.application.service;

import com.sgdis.backend.data.regional.entity.RegionalEntity;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.institution.application.dto.*;
import com.sgdis.backend.institution.application.port.in.*;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.institution.infrastructure.repository.SpringDataInstitutionRepository;
import com.sgdis.backend.institution.mapper.InstitutionMapper;
// Auditoría
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstitutionService implements
        CreateInstitutionUseCase,
        GetAllInstitutionUseCase,
        GetByIdInstitutionUseCase,
        UpdateInstitutionUseCase,
        GetAllInstitutionsByRegionalIdUseCase
{

    private final SpringDataInstitutionRepository institutionRepository;
    private final SpringDataRegionalRepository institutionRegionalRepository;
    private final RecordActionUseCase recordActionUseCase;


    @Override
    public List<GetAllInstitutionResponse> getAllInstitution() {
        return institutionRepository.findAllWithRelations()
                .stream()
                .map(InstitutionMapper::toGetAllResponse)
                .collect(Collectors.toList());
    }

    @Override
    public GetByIdResponse getById(Long id) {
        InstitutionEntity institution = institutionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Institution with id " + id + " not found"));
        return InstitutionMapper.toGetByIdResponse(institution);
    }

    @Override
    public UpdateInstitutionResponse updateInstitution(Long id, UpdateInstitutionRequest request) {
        // Obtener la institución existente para comparar valores
        InstitutionEntity existingInstitution = institutionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Institution with id " + id + " not found"));
        
        // Guardar valores originales para auditoría
        String originalName = existingInstitution.getName();
        String originalCodeInstitution = existingInstitution.getCodeInstitution();
        Long originalRegionalId = existingInstitution.getRegional() != null ? existingInstitution.getRegional().getId() : null;
        Long originalCityId = existingInstitution.getCity() != null ? existingInstitution.getCity().getId() : null;
        
        InstitutionEntity institution = InstitutionMapper.fromUpdateRequest(request, id);
        InstitutionEntity updatedInstitution = institutionRepository.save(institution);
        
        // Registrar auditoría - construir descripción de cambios
        StringBuilder changes = new StringBuilder();
        if (request.name() != null && !request.name().equals(originalName)) {
            changes.append("Nombre actualizado | ");
        }
        if (request.codeInstitution() != null && !request.codeInstitution().equals(originalCodeInstitution)) {
            changes.append("Código actualizado | ");
        }
        if (request.regionalId() != null && !request.regionalId().equals(originalRegionalId)) {
            changes.append("Regional actualizada | ");
        }
        if (request.cityId() != null && !request.cityId().equals(originalCityId)) {
            changes.append("Ciudad actualizada | ");
        }
        
        String changesDescription = changes.length() > 0 
                ? changes.toString().substring(0, changes.length() - 3) 
                : "Sin cambios";
        
        String institutionName = updatedInstitution.getName() != null ? updatedInstitution.getName() : "sin nombre";
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Institución actualizada: %s (ID: %d) - %s", 
                        institutionName,
                        id,
                        changesDescription)
        ));
        
        return InstitutionMapper.toUpdateResponse(updatedInstitution);
    }

    @Override
    public InstitutionResponse createInstitution(CreateInstitutionRequest createInstitutionRequest) {
        InstitutionEntity institution = InstitutionMapper.fromCreateRequest(createInstitutionRequest);
        InstitutionEntity saved = institutionRepository.save(institution);
        
        // Registrar auditoría
        String regionalName = saved.getRegional() != null && saved.getRegional().getName() != null 
                ? saved.getRegional().getName() : "N/A";
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Institución creada: %s (ID: %d) - Código: %s - Regional: %s", 
                        saved.getName() != null ? saved.getName() : "sin nombre",
                        saved.getId(),
                        saved.getCodeInstitution() != null ? saved.getCodeInstitution() : "N/A",
                        regionalName)
        ));
        
        return InstitutionMapper.toResponse(saved);
    }

    @Override
    public List<InstitutionResponseWithoutRegionalResponse> getAllInstitutionsByRegionalId(Long id) {
        // First validate that the regional exists
        institutionRegionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Regional with id " + id + " not found"));
        
        // Use the more efficient method to find institutions by regional ID directly
        List<InstitutionEntity> institutions = institutionRepository.findByRegionalId(id);
        
        // Map entities to DTO response without regional data
        return InstitutionMapper.toInstitutionListWithoutRegional(institutions);
    }
}
