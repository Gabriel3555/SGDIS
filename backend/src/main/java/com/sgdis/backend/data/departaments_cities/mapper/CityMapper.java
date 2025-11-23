package com.sgdis.backend.data.departaments_cities.mapper;

import com.sgdis.backend.data.departaments_cities.dto.CityResponse;
import com.sgdis.backend.data.departaments_cities.entity.CityEntity;

import java.util.ArrayList;
import java.util.List;

public final class CityMapper {

    private CityMapper() {}

    public static CityResponse toResponse(CityEntity entity) {
        return new CityResponse(
                entity.getId(),
                entity.getCity()
        );
    }

    public static List<CityResponse> toResponse(List<CityEntity> entities) {
        List<CityResponse> responses = new ArrayList<>();
        for (CityEntity entity : entities) {
            responses.add(toResponse(entity));
        }
        return responses;
    }
}

