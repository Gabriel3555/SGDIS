package com.sgdis.backend.institution.mapper;

import com.sgdis.backend.data.departaments_cities.entity.CityEntity;
import com.sgdis.backend.data.regional.entity.RegionalEntity;
import com.sgdis.backend.institution.application.dto.*;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;

import java.util.List;
import java.util.Objects;

public final class InstitutionMapper {

    private InstitutionMapper() {}

    public static GetAllInstitutionResponse toGetAllResponse(InstitutionEntity entity) {
        if (entity == null) return null;
        return new GetAllInstitutionResponse(
                entity.getId(),
                entity.getName(),
                entity.getCodeInstitution(),
                entity.getRegional() != null ? entity.getRegional().getId() : null,
                entity.getRegional() != null ? entity.getRegional().getName() : null,
                entity.getCity() != null ? entity.getCity().getId() : null,
                entity.getCity() != null ? entity.getCity().getCity() : null
        );
    }

    public static GetByIdResponse toGetByIdResponse(InstitutionEntity entity) {
        if (entity == null) return null;
        return new GetByIdResponse(
                entity.getId(),
                entity.getName(),
                entity.getCodeInstitution(),
                entity.getRegional() != null ? entity.getRegional().getId() : null,
                entity.getCity() != null ? entity.getCity().getId() : null
        );
    }

    public static InstitutionResponse toResponse(InstitutionEntity entity) {
        if (entity == null) return null;
        return new InstitutionResponse(
                entity.getId(),
                entity.getName(),
                entity.getCodeInstitution(),
                entity.getRegional() != null ? entity.getRegional().getId() : null,
                entity.getCity() != null ? entity.getCity().getId() : null
        );
    }

    public static UpdateInstitutionResponse toUpdateResponse(InstitutionEntity entity) {
        if (entity == null) return null;
        return new UpdateInstitutionResponse(
                entity.getId(),
                entity.getName(),
                entity.getCodeInstitution(),
                entity.getRegional() != null ? entity.getRegional().getId() : null,
                entity.getCity() != null ? entity.getCity().getId() : null
        );
    }

    public static CreateInstitutionResponse toCreateResponse(InstitutionEntity entity) {
        if (entity == null) return null;
        return new CreateInstitutionResponse(
                entity.getId(),
                entity.getName(),
                entity.getCodeInstitution(),
                entity.getRegional() != null ? entity.getRegional().getId() : null,
                entity.getCity() != null ? entity.getCity().getId() : null
        );
    }

    public static InstitutionEntity fromCreateRequest(CreateInstitutionRequest dto) {
        if (dto == null) return null;
        var builder = InstitutionEntity.builder()
                .codeInstitution(dto.codeInstitution())
                .name(dto.name());

        if (dto.regionalId() != null) {
            var regional = new RegionalEntity();
            regional.setId(dto.regionalId());
            builder.regional(regional);
        }
        if (dto.cityId() != null) {
            var city = new CityEntity();
            city.setId(dto.cityId());
            builder.city(city);
        }
        return builder.build();
    }

    public static InstitutionEntity fromUpdateRequest(UpdateInstitutionRequest dto, Long id) {
        if (dto == null) return null;
        var builder = InstitutionEntity.builder()
                .id(id)
                .codeInstitution(dto.codeInstitution())
                .name(dto.name());

        if (dto.regionalId() != null) {
            var regional = new RegionalEntity();
            regional.setId(dto.regionalId());
            builder.regional(regional);
        }
        if (dto.cityId() != null) {
            var city = new CityEntity();
            city.setId(dto.cityId());
            builder.city(city);
        }
        return builder.build();
    }

    public static InstitutionResponseWithoutRegionalResponse toInstitutionWithoutRegional(InstitutionEntity entity) {
        return new InstitutionResponseWithoutRegionalResponse(
                entity.getId(),
                entity.getName(),
                entity.getCodeInstitution(),
                entity.getCity().getId()
        );
    }

    public static List<InstitutionResponseWithoutRegionalResponse> toInstitutionListWithoutRegional(List<InstitutionEntity> entities) {
        if (entities == null || entities.isEmpty()) return List.of();
        return entities.stream()
                .map(InstitutionMapper::toInstitutionWithoutRegional)
                .filter(Objects::nonNull) // opcional
                .toList(); // si usas Java 16+, o Collectors.toList() en Java 8–15
    }

}
