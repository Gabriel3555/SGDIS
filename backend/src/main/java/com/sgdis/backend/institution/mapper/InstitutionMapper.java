package com.sgdis.backend.institution.mapper;

import com.sgdis.backend.data.departaments_cities.entity.CityEntity;
import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.institution.application.dto.*;
import com.sgdis.backend.institution.domain.Institution;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;

public final class InstitutionMapper {

    private InstitutionMapper() {}

    public static Institution toDomain(InstitutionEntity entity) {
        if (entity == null) return null;
        return new Institution(
                entity.getId(),
                entity.getName(),
                entity.getRegional(),
                entity.getCity()
        );
    }

    public static InstitutionEntity toEntity(Institution institution) {
        if (institution == null) return null;
        return InstitutionEntity.builder()
                .id(institution.getId())
                .name(institution.getName())
                .regional(institution.getRegional())
                .city(institution.getCity())
                .build();
    }

    public static GetAllInstitutionResponse toGetAllResponse(Institution i) {
        if (i == null) return null;
        return new GetAllInstitutionResponse(
                i.getId(),
                i.getName(),
                i.getRegional() != null ? i.getRegional().getId() : null,
                i.getCity() != null ? i.getCity().getId() : null
        );
    }

    public static GetByIdResponse toGetByIdResponse(Institution i) {
        if (i == null) return null;
        return new GetByIdResponse(
                i.getId(),
                i.getName(),
                i.getRegional() != null ? i.getRegional().getId() : null,
                i.getCity() != null ? i.getCity().getId() : null
        );
    }

    public static InstitutionResponse toResponse(Institution i) {
        if (i == null) return null;
        return new InstitutionResponse(
                i.getId(),
                i.getName(),
                i.getRegional() != null ? i.getRegional().getId() : null,
                i.getCity() != null ? i.getCity().getId() : null
        );
    }

    public static UpdateInstitutionResponse toUpdateResponse(Institution i) {
        if (i == null) return null;
        return new UpdateInstitutionResponse(
                i.getId(),
                i.getName(),
                i.getRegional() != null ? i.getRegional().getId() : null,
                i.getCity() != null ? i.getCity().getId() : null
        );
    }

    public static Institution toDomain(CreateInstitutionRequest dto) {
        if (dto == null) return null;
        var inst = new Institution();
        inst.setName(dto.name());

        if (dto.regionalId() != null) {
            var regional = new RegionalEntity();
            regional.setId(dto.regionalId());
            inst.setRegional(regional);
        }
        if (dto.cityId() != null) {
            var city = new CityEntity();
            city.setId(dto.cityId());
            inst.setCity(city);
        }
        return inst;
    }

    public static Institution toDomain(UpdateInstitutionRequest dto, Long id) {
        if (dto == null) return null;
        var inst = new Institution();
        inst.setId(id);
        inst.setName(dto.name());

        if (dto.regionalId() != null) {
            var regional = new RegionalEntity();
            regional.setId(dto.regionalId());
            inst.setRegional(regional);
        }
        if (dto.cityId() != null) {
            var city = new CityEntity();
            city.setId(dto.cityId());
            inst.setCity(city);
        }
        return inst;
    }
}
