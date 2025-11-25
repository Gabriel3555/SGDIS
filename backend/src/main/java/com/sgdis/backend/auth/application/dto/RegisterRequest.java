package com.sgdis.backend.auth.application.dto;

public record RegisterRequest(
    String password,
    String email,
    String fullName,
    String jobTitle,
    String laborDepartment,
    Long institutionId
) {}