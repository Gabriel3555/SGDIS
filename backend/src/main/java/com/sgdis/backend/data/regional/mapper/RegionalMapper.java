package com.sgdis.backend.data.regional.mapper;

import com.sgdis.backend.data.regional.dto.RegionalResponse;
import com.sgdis.backend.data.regional.entity.RegionalEntity;

import java.util.ArrayList;
import java.util.List;

public final class RegionalMapper {

    private RegionalMapper() {}

    public static RegionalResponse toResponse(RegionalEntity entity) {
        return new RegionalResponse(
                entity.getId(),
                entity.getName(),
                entity.getDepartament() != null ? entity.getDepartament().getId() : null
        );
    }

    public static List<RegionalResponse> toResponse(List<RegionalEntity> entities) {
        List<RegionalResponse> responses = new ArrayList<>();
        for (RegionalEntity entity : entities) {
            responses.add(toResponse(entity));
        }
        return responses;
    }
}
