package com.sgdis.backend.institution.application.dto;

import com.sgdis.backend.data.departaments_cities.entity.CityEntity;
import com.sgdis.backend.data.regional.RegionalEntity;

public record GetByIdResponse(
        Long id,
        String name,
        RegionalEntity regional,
        CityEntity city
) {
}
