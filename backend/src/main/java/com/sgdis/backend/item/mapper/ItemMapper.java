package com.sgdis.backend.item.mapper;

import com.sgdis.backend.item.application.dto.CreateItemRequest;
import com.sgdis.backend.item.application.dto.ItemDTO;
import com.sgdis.backend.item.application.dto.UpdateItemRequest;
import com.sgdis.backend.item.domain.Attribute;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class ItemMapper {

    private ItemMapper() {}

    public static ItemEntity toEntity(CreateItemRequest request) {
        boolean status = request.status() == null ? true : request.status();
        Map<Attribute, String> attributes = new java.util.HashMap<>();
        attributes.put(Attribute.BRAND, request.brand() != null ? request.brand() : "");
        attributes.put(Attribute.SERIAL, request.serial() != null ? request.serial() : "");
        attributes.put(Attribute.MODEL, request.model() != null ? request.model() : "");
        attributes.put(Attribute.OBSERVATIONS, request.observations() != null ? request.observations() : "");

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
                // location se establecerá en ItemService usando el del inventario si no está presente
                .location(request.location())
                .status(status)
                .build();

        StringBuilder allAttributes = new StringBuilder();

        for(Map.Entry<Attribute, String> entry : attributes.entrySet()) {
            Attribute clave = entry.getKey();
            String valor = entry.getValue();
            allAttributes.append(clave).append(":").append(valor).append(";");
        }

        itemEntity.setAttributes(attributes);
        // Truncar allAttributes a máximo 255 caracteres para evitar errores de base de datos
        String allAttributesStr = allAttributes.toString();
        if (allAttributesStr.length() > 255) {
            allAttributesStr = allAttributesStr.substring(0, 252) + "...";
        }
        itemEntity.setAllAttributes(allAttributesStr);

        return itemEntity;
    }

    public static ItemEntity toEntity(UpdateItemRequest request, ItemEntity existingEntity) {
        Map<Attribute, String> attributes = new java.util.HashMap<>();
        attributes.put(Attribute.BRAND, request.brand() != null ? request.brand() : "");
        attributes.put(Attribute.SERIAL, request.serial() != null ? request.serial() : "");
        attributes.put(Attribute.MODEL, request.model() != null ? request.model() : "");
        attributes.put(Attribute.OBSERVATIONS, request.observations() != null ? request.observations() : "");

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
        // Truncar allAttributes a máximo 255 caracteres para evitar errores de base de datos
        String allAttributesStr = allAttributes.toString();
        if (allAttributesStr.length() > 255) {
            allAttributesStr = allAttributesStr.substring(0, 252) + "...";
        }
        existingEntity.setAllAttributes(allAttributesStr);

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
                itemEntity.getLocation() != null ? itemEntity.getLocation() : "",
                itemEntity.getResponsible() != null ? itemEntity.getResponsible() : "",
                itemEntity.getUrlsImages() != null ? itemEntity.getUrlsImages().get(0) : null,
                itemEntity.isStatus()
        );
    }

    public static List<ItemDTO> toDTOList(List<ItemEntity> itemEntities) {
        List<ItemDTO> dtos = new ArrayList<>();
        for(ItemEntity itemEntity : itemEntities) {
            dtos.add(toDTO(itemEntity));
        }
        return dtos;
    }
}