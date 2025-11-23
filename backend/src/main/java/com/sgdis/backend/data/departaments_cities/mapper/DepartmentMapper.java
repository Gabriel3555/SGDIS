package com.sgdis.backend.data.departaments_cities.mapper;

import com.sgdis.backend.data.departaments_cities.dto.DepartmentResponse;
import com.sgdis.backend.data.departaments_cities.entity.DepartamentEntity;

import java.util.ArrayList;
import java.util.List;

public final class DepartmentMapper {

    private DepartmentMapper() {}

    public static DepartmentResponse toResponse(DepartamentEntity entity) {
        return new DepartmentResponse(
                entity.getId(),
                entity.getDepartament()
        );
    }

    public static List<DepartmentResponse> toResponse(List<DepartamentEntity> entities) {
        List<DepartmentResponse> responses = new ArrayList<>();
        for (DepartamentEntity entity : entities) {
            responses.add(toResponse(entity));
        }
        return responses;
    }
}

