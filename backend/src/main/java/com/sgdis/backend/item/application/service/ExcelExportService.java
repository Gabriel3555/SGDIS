package com.sgdis.backend.item.application.service;

import com.sgdis.backend.exception.DomainNotFoundException;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExcelExportService {

    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] exportInventoryItemsToExcel(Long inventoryId) throws IOException {
        // Obtener el inventario con sus relaciones
        InventoryEntity inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new DomainNotFoundException("Inventory not found with id: " + inventoryId));

        // Obtener todos los items del inventario
        List<ItemEntity> items = itemRepository.findAllByInventoryId(inventoryId);

        // Obtener códigos (solo una vez)
        String regionalCode = "";
        String institutionCode = "";

        if (inventory.getInstitution() != null) {
            if (inventory.getInstitution().getRegional() != null) {
                regionalCode = inventory.getInstitution().getRegional().getRegionalCode() != null 
                    ? inventory.getInstitution().getRegional().getRegionalCode() 
                    : "";
            }
            institutionCode = inventory.getInstitution().getCodeInstitution() != null 
                ? inventory.getInstitution().getCodeInstitution() 
                : "";
        }

        // Crear el workbook
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Items");

        // Crear estilo para el encabezado
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setFontHeightInPoints((short) 12);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);

        // Crear fila de encabezado
        Row headerRow = sheet.createRow(0);
        String[] headers = {
            "ir_id",
            "Cód. regional",
            "Cód. Centro",
            "Desc. Almacen",
            "No. de placa",
            "Consecutivo",
            "Desc. SKU",
            "Descripción elemento",
            "Atributos",
            "Fecha adq",
            "Valor adq",
            "iv_id",
            "Ubicación"
        };

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Crear estilo para fechas
        CellStyle dateStyle = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("dd/mm/yyyy"));

        // Crear estilo para números
        CellStyle numberStyle = workbook.createCellStyle();
        DataFormat numberFormat = workbook.createDataFormat();
        numberStyle.setDataFormat(numberFormat.getFormat("#,##0.00"));

        // Llenar datos
        int rowNum = 1;
        for (ItemEntity item : items) {
            Row row = sheet.createRow(rowNum++);

            // Columna A: irId
            setCellValue(row, 0, item.getIrId());

            // Columna B: Cód. regional
            setCellValue(row, 1, regionalCode);

            // Columna C: Cód. Centro
            setCellValue(row, 2, institutionCode);

            // Columna D: wareHouseDescription
            setCellValue(row, 3, item.getWareHouseDescription());

            // Columna E: licencePlateNumber
            setCellValue(row, 4, item.getLicencePlateNumber());

            // Columna F: consecutiveNumber
            setCellValue(row, 5, item.getConsecutiveNumber());

            // Columna G: skuDescription
            setCellValue(row, 6, item.getSkuDescription());

            // Columna H: descriptionElement
            setCellValue(row, 7, item.getDescriptionElement());

            // Columna I: allAttributes
            setCellValue(row, 8, item.getAllAttributes());

            // Columna J: acquisitionDate
            if (item.getAcquisitionDate() != null) {
                Cell dateCell = row.createCell(9);
                dateCell.setCellValue(item.getAcquisitionDate().atStartOfDay().atZone(java.time.ZoneId.systemDefault()).toLocalDate());
                dateCell.setCellStyle(dateStyle);
            }

            // Columna K: acquisitionValue
            if (item.getAcquisitionValue() != null) {
                Cell valueCell = row.createCell(10);
                valueCell.setCellValue(item.getAcquisitionValue());
                valueCell.setCellStyle(numberStyle);
            }

            // Columna L: ivId
            setCellValue(row, 11, item.getIvId());

            // Columna M: location
            setCellValue(row, 12, item.getLocation());
        }

        // Ajustar ancho de columnas
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
            // Añadir un poco de padding
            sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 1000);
        }

        // Convertir a byte array
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream.toByteArray();
    }

    private void setCellValue(Row row, int columnIndex, String value) {
        Cell cell = row.createCell(columnIndex);
        if (value != null && !value.trim().isEmpty()) {
            cell.setCellValue(value);
        } else {
            cell.setCellValue("");
        }
    }
}

