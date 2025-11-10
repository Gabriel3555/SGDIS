package com.sgdis.backend.user.application.dto;

import com.sgdis.backend.data.regional.RegionalEntity;

import java.util.List;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String jobTitle,
        String laborDepartment,
        String imgUrl,
        String role,
        Boolean status,
        List<RegionalEntity> regionals
) {}
