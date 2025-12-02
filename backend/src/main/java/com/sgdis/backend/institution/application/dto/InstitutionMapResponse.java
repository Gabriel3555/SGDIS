package com.sgdis.backend.institution.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InstitutionMapResponse {
    private Long id;
    private String name;
    private String codeInstitution;
    private Double latitude;
    private Double longitude;
    private String cityName;
    private String regionalName;
    private Long regionalId;
    private String departamentName;
}

