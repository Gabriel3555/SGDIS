package com.sgdis.backend.item.application.dto;

import java.time.LocalDate;

public record CreateItemRequest(
    String irId,
    String productName,
    String wareHouseDescription,
    String licencePlateNumber,
    String consecutiveNumber,
    String skuDescription,
    String descriptionElement,
    String brand,
    String serial,
    String model,
    String observations,
    LocalDate acquisitionDate,
    Double acquisitionValue,
    String ivId,
    String location,
    Long inventoryId,
    Long categoryId,
    Boolean status
) {}
