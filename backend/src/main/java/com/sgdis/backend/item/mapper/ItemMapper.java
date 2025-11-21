package com.sgdis.backend.item.mapper;

import com.sgdis.backend.item.application.dto.CreateItemRequest;
import com.sgdis.backend.item.application.dto.ItemDTO;
import com.sgdis.backend.item.application.dto.CreateItemResponse;
import com.sgdis.backend.item.application.dto.UpdateItemRequest;
import com.sgdis.backend.item.application.dto.UpdateItemResponse;
import com.sgdis.backend.item.domain.Attribute;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class ItemMapper {

    private ItemMapper() {}

    public static ItemEntity toEntity(CreateItemRequest request) {
        boolean status = request.status() == null ? true : request.status();
        Map<Attribute, String> attributes = Map.of(
                Attribute.BRAND, request.brand(),
                Attribute.SERIAL, request.serial(),
                Attribute.MODEL, request.model(),
                Attribute.OBSERVATIONS, request.observations()
        );

        ItemEntity itemEntity = ItemEntity.builder()
                .irId(request.irId())
                .productName(request.productName())
                .wareHouseDescription(request.wareHouseDescription())
                .licencePlateNumber(request.licencePlateNumber())
                .consecutiveNumber(request.consecutiveNumber())
                .skuDescription(request.skuDescription())
                .descriptionElement(request.descriptionElement())
                .acquisitionDate(request.acquisitionDate())
                .acquisitionValue(request.acquisitionValue())
                .ivId(request.ivId())
                .status(status)
                .build();

        StringBuilder allAttributes = new StringBuilder();

        for(Map.Entry<Attribute, String> entry : attributes.entrySet()) {
            Attribute clave = entry.getKey();
            String valor = entry.getValue();
            allAttributes.append(clave).append(":").append(valor).append(";");
        }

        itemEntity.setAttributes(attributes);
        itemEntity.setAllAttributes(allAttributes.toString());

        return itemEntity;
    }

    public static ItemEntity toEntity(UpdateItemRequest request, ItemEntity existingEntity) {
        Map<Attribute, String> attributes = Map.of(
                Attribute.BRAND, request.brand(),
                Attribute.SERIAL, request.serial(),
                Attribute.MODEL, request.model(),
                Attribute.OBSERVATIONS, request.observations()
        );

        existingEntity.setIrId(request.irId());
        existingEntity.setProductName(request.productName());
        existingEntity.setWareHouseDescription(request.wareHouseDescription());
        existingEntity.setLicencePlateNumber(request.licencePlateNumber());
        existingEntity.setConsecutiveNumber(request.consecutiveNumber());
        existingEntity.setSkuDescription(request.skuDescription());
        existingEntity.setDescriptionElement(request.descriptionElement());
        existingEntity.setAcquisitionDate(request.acquisitionDate());
        existingEntity.setAcquisitionValue(request.acquisitionValue());
        existingEntity.setIvId(request.ivId());
        if (request.status() != null) {
            existingEntity.setStatus(request.status());
        }

        StringBuilder allAttributes = new StringBuilder();

        for(Map.Entry<Attribute, String> entry : attributes.entrySet()) {
            Attribute clave = entry.getKey();
            String valor = entry.getValue();
            allAttributes.append(clave).append(":").append(valor).append(";");
        }

        existingEntity.setAttributes(attributes);
        existingEntity.setAllAttributes(allAttributes.toString());

        return existingEntity;
    }

    public static ItemDTO toDTO(ItemEntity itemEntity) {
        return new ItemDTO(
                itemEntity.getId(),
                itemEntity.getProductName(),
                itemEntity.getLicencePlateNumber(),
                itemEntity.getAcquisitionDate(),
                itemEntity.getAcquisitionValue(),
                itemEntity.getAttributes(),
                itemEntity.getCategory() != null ? itemEntity.getCategory().getName() : "",
                itemEntity.getLocation() != null ? itemEntity.getLocation() : "",
                itemEntity.getResponsible() != null ? itemEntity.getResponsible() : "",
                itemEntity.getUrlsImages() != null ? itemEntity.getUrlsImages().get(0) : null,
                itemEntity.isStatus()
        );
    }
}