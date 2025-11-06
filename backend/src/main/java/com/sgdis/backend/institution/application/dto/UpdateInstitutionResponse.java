package com.sgdis.backend.institution.application.dto;

import com.sgdis.backend.data.departaments_cities.entity.CityEntity;
import com.sgdis.backend.data.regional.RegionalEntity;

public record UpdateInstitutionResponse(
        Long id,
        String name,
        Long regionalId,
        Long cityId
) {}
