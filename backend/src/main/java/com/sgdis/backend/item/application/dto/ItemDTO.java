package com.sgdis.backend.item.application.dto;

import com.sgdis.backend.item.domain.Attribute;

import java.time.LocalDate;
import java.util.Map;

public record ItemDTO(
        Long id,
        String productName,
        String licencePlateNumber,
        LocalDate acquisitionDate,
        Double acquisitionValue,
        Map<Attribute, String> attributes,
        String categoryName
) {}
