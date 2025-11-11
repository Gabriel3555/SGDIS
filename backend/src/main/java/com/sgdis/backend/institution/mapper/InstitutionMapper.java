package com.sgdis.backend.institution.mapper;

import com.sgdis.backend.data.departaments_cities.entity.CityEntity;
import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.institution.application.dto.*;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;

public final class InstitutionMapper {

    private InstitutionMapper() {}

    public static GetAllInstitutionResponse toGetAllResponse(InstitutionEntity entity) {
        if (entity == null) return null;
        return new GetAllInstitutionResponse(
                entity.getId(),
                entity.getName(),
                entity.getRegional() != null ? entity.getRegional().getId() : null,
                entity.getCity() != null ? entity.getCity().getId() : null
        );
    }

    public static GetByIdResponse toGetByIdResponse(InstitutionEntity entity) {
        if (entity == null) return null;
        return new GetByIdResponse(
                entity.getId(),
                entity.getName(),
                entity.getRegional() != null ? entity.getRegional().getId() : null,
                entity.getCity() != null ? entity.getCity().getId() : null
        );
    }

    public static InstitutionResponse toResponse(InstitutionEntity entity) {
        if (entity == null) return null;
        return new InstitutionResponse(
                entity.getId(),
                entity.getName(),
                entity.getRegional() != null ? entity.getRegional().getId() : null,
                entity.getCity() != null ? entity.getCity().getId() : null
        );
    }

    public static UpdateInstitutionResponse toUpdateResponse(InstitutionEntity entity) {
        if (entity == null) return null;
        return new UpdateInstitutionResponse(
                entity.getId(),
                entity.getName(),
                entity.getRegional() != null ? entity.getRegional().getId() : null,
                entity.getCity() != null ? entity.getCity().getId() : null
        );
    }

    public static CreateInstitutionResponse toCreateResponse(InstitutionEntity entity) {
        if (entity == null) return null;
        return new CreateInstitutionResponse(
                entity.getId(),
                entity.getName(),
                entity.getRegional() != null ? entity.getRegional().getId() : null,
                entity.getCity() != null ? entity.getCity().getId() : null
        );
    }

    public static InstitutionEntity fromCreateRequest(CreateInstitutionRequest dto) {
        if (dto == null) return null;
        var builder = InstitutionEntity.builder()
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
}
