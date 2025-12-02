package com.sgdis.backend.data.regional.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegionalMapResponse {
    private Long id;
    private String name;
    private String regionalCode;
    private Double latitude;
    private Double longitude;
    private String departamentName;
    private Integer institutionsCount;
}

