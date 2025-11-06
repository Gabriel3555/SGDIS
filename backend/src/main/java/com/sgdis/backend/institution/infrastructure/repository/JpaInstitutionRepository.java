package com.sgdis.backend.institution.infrastructure.repository;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.institution.application.port.out.CreateInstitutionRepository;
import com.sgdis.backend.institution.application.port.out.GetAllInstitutionRepository;
import com.sgdis.backend.institution.application.port.out.GetByIdInstitutionRepository;
import com.sgdis.backend.institution.application.port.out.UpdateInstitutionRepository;
import com.sgdis.backend.institution.domain.Institution;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.institution.mapper.InstitutionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class JpaInstitutionRepository implements
        CreateInstitutionRepository,
        GetAllInstitutionRepository,
        GetByIdInstitutionRepository,
        UpdateInstitutionRepository
{

    private final SpringDataInstitutionRepository springDataInstitutionRepository;

    @Override
    public Institution createInstitution(Institution institution) {
        InstitutionEntity entity = InstitutionMapper.toEntity(institution);
        InstitutionEntity savedEntity = springDataInstitutionRepository.save(entity);
        return InstitutionMapper.toDomain(savedEntity);
    }

    @Override
    public List<Institution> getAllInstitutions() {
        return springDataInstitutionRepository.findAll()
                .stream()
                .map(InstitutionMapper::toDomain)
                .toList();
    }

    @Override
    public Institution getById(Long id) {
        return springDataInstitutionRepository.findById(id)
                .map(InstitutionMapper::toDomain)
                .orElseThrow(()-> new ResourceNotFoundException("Institution whir id " + id +  " not found"));
    }

    @Override
    public Institution updateInstitution(Institution institution) {
        InstitutionEntity entity = InstitutionMapper.toEntity(institution);
        return InstitutionMapper.toDomain(springDataInstitutionRepository.save(entity));
    }
}
