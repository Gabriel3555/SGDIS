package com.sgdis.backend.user.application.dto;

import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;

public record UserRegionalDto(
        UserEntity user,
        RegionalEntity regional
) {}
