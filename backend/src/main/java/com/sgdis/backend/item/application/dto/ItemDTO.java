package com.sgdis.backend.item.application.dto;

import com.sgdis.backend.item.domain.Attribute;

import java.time.LocalDate;
import java.util.Map;

public record ItemDTO(
        Long id,
        String irId,
        String ivId,
        String productName,
        String wareHouseDescription,
        String licencePlateNumber,
        String consecutiveNumber,
        String skuDescription,
        String descriptionElement,
        LocalDate acquisitionDate,
        Double acquisitionValue,
        Map<Attribute, String> attributes,
        String location,
        String responsible,
        String urlImg,
        Boolean status,
        Long inventoryId,
        String inventoryName
) {}
