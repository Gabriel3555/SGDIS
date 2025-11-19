package com.sgdis.backend.user.application.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UpdateUserRequest(
        String fullName,
        String jobTitle,
        String laborDepartment,
        String email,
        String role,
        Boolean status,
        @JsonProperty("institutionId")
        Long institutionId
) {}
