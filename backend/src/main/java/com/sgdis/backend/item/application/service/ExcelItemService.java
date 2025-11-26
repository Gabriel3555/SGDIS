package com.sgdis.backend.item.application.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.exception.DomainValidationException;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.item.application.dto.BulkUploadResponse;
import com.sgdis.backend.item.application.dto.CreateItemRequest;
import com.sgdis.backend.item.application.port.CreateItemUseCase;
// Auditoría
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ExcelItemService {

    private final CreateItemUseCase createItemUseCase;
    private final AuthService authService;
    private final SpringDataInventoryRepository inventoryRepository;
    private final RecordActionUseCase recordActionUseCase;
    private static final Pattern ATTRIBUTE_PATTERN = Pattern.compile("(MARCA|SERIAL|MODELO|OBSERVACIONES):([^;]+)");
    private static final int MAX_STRING_LENGTH = 255;

    public BulkUploadResponse processExcelFile(MultipartFile file, Long inventoryId) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new DomainValidationException("El archivo Excel no puede estar vacío");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xls") && !filename.endsWith(".xlsx"))) {
            throw new DomainValidationException("El archivo debe ser un Excel (.xls o .xlsx)");
        }

        Workbook workbook;
        try {
            if (filename.endsWith(".xlsx")) {
                workbook = new XSSFWorkbook(file.getInputStream());
            } else {
                workbook = new HSSFWorkbook(file.getInputStream());
            }
        } catch (Exception e) {
            throw new DomainValidationException("Error al leer el archivo Excel: " + e.getMessage());
        }

        Sheet sheet = workbook.getSheetAt(0);
        if (sheet == null) {
            workbook.close();
            throw new DomainValidationException("El archivo Excel no contiene hojas");
        }

        List<String> errors = new ArrayList<>();
        int successfulItems = 0;
        int totalRows = 0;

        // Comenzar desde la segunda fila (índice 1, ya que 0 es el encabezado)
        for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }

            // Verificar si la fila está vacía
            if (isRowEmpty(row)) {
                continue;
            }

            totalRows++;
            
            try {
                // Leer columnas según especificación
                String irId = getCellValueAsString(row, 0); // Columna A
                String wareHouseDescription = getCellValueAsString(row, 3); // Columna D
                String licencePlateNumber = getCellValueAsString(row, 4); // Columna E
                String consecutiveNumber = getCellValueAsString(row, 5); // Columna F
                String skuDescription = getCellValueAsString(row, 6); // Columna G (también productName)
                String descriptionElement = getCellValueAsString(row, 7); // Columna H
                String attributesString = getCellValueAsString(row, 8); // Columna I
                LocalDate acquisitionDate = getCellValueAsDate(row, 10); // Columna K
                Double acquisitionValue = getCellValueAsDouble(row, 11); // Columna L
                String ivId = getCellValueAsString(row, 14); // Columna O
                String location = getCellValueAsString(row, 15); // Columna P

                // Parsear atributos de la columna I
                String brand = "";
                String serial = "";
                String model = "";
                String observations = "";

                if (attributesString != null && !attributesString.trim().isEmpty()) {
                    Matcher matcher = ATTRIBUTE_PATTERN.matcher(attributesString);
                    while (matcher.find()) {
                        String key = matcher.group(1).trim();
                        String value = matcher.group(2).trim();
                        switch (key) {
                            case "MARCA":
                                brand = value;
                                break;
                            case "SERIAL":
                                serial = value;
                                break;
                            case "MODELO":
                                model = value;
                                break;
                            case "OBSERVACIONES":
                                observations = value;
                                break;
                        }
                    }
                }

                // skuDescription también se usa como productName
                String productName = skuDescription != null && !skuDescription.trim().isEmpty() 
                    ? skuDescription 
                    : (wareHouseDescription != null ? wareHouseDescription : "");

                // Validar campos requeridos
                if (licencePlateNumber == null || licencePlateNumber.trim().isEmpty()) {
                    errors.add("Fila " + (rowIndex + 1) + ": El número de placa es obligatorio");
                    continue;
                }

                // Truncar todos los campos String a máximo 255 caracteres para evitar errores de base de datos
                irId = truncateString(irId);
                productName = truncateString(productName);
                wareHouseDescription = truncateString(wareHouseDescription);
                licencePlateNumber = truncateString(licencePlateNumber);
                consecutiveNumber = truncateString(consecutiveNumber);
                skuDescription = truncateString(skuDescription);
                descriptionElement = truncateString(descriptionElement);
                ivId = truncateString(ivId);
                location = truncateString(location);
                brand = truncateString(brand);
                serial = truncateString(serial);
                model = truncateString(model);
                observations = truncateString(observations);

                // Crear el item
                CreateItemRequest createRequest = new CreateItemRequest(
                    irId,
                    productName,
                    wareHouseDescription,
                    licencePlateNumber,
                    consecutiveNumber,
                    skuDescription,
                    descriptionElement,
                    brand,
                    serial,
                    model,
                    observations,
                    acquisitionDate,
                    acquisitionValue,
                    ivId,
                    location,
                    inventoryId,
                    true // status por defecto
                );

                createItemUseCase.createItem(createRequest);
                successfulItems++;

            } catch (Exception e) {
                errors.add("Fila " + (rowIndex + 1) + ": " + e.getMessage());
            }
        }

        workbook.close();
        
        int failedItems = totalRows - successfulItems;
        
        // Registrar auditoría
        try {
            var currentUser = authService.getCurrentUser();
            var inventory = inventoryRepository.findById(inventoryId);
            String inventoryName = inventory.isPresent() && inventory.get().getName() != null 
                    ? inventory.get().getName() : "sin nombre";
            String fileNameForAudit = filename != null ? filename : "archivo desconocido";
            
            recordActionUseCase.recordAction(new RecordActionRequest(
                    String.format("Carga masiva de items desde Excel: Archivo %s - Inventario: %s (ID: %d) - Total filas: %d - Exitosos: %d - Fallidos: %d - Usuario: %s (%s)", 
                            fileNameForAudit,
                            inventoryName,
                            inventoryId,
                            totalRows,
                            successfulItems,
                            failedItems,
                            currentUser.getFullName(),
                            currentUser.getEmail())
            ));
        } catch (Exception e) {
            // Si hay error al obtener el usuario o inventario, no fallar la carga
            // Solo registrar sin información del usuario
            String fileNameForAudit = filename != null ? filename : "archivo desconocido";
            recordActionUseCase.recordAction(new RecordActionRequest(
                    String.format("Carga masiva de items desde Excel: Archivo %s - Inventario ID %d - Total filas: %d - Exitosos: %d - Fallidos: %d", 
                            fileNameForAudit,
                            inventoryId,
                            totalRows,
                            successfulItems,
                            failedItems)
            ));
        }
        
        return new BulkUploadResponse(totalRows, successfulItems, failedItems, errors);
    }

    private String getCellValueAsString(Row row, int columnIndex) {
        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Convertir número a string sin decimales si es entero
                    double numValue = cell.getNumericCellValue();
                    if (numValue == (long) numValue) {
                        return String.valueOf((long) numValue);
                    } else {
                        return String.valueOf(numValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    private LocalDate getCellValueAsDate(Row row, int columnIndex) {
        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return null;
        }

        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                Date date = cell.getDateCellValue();
                return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            } else if (cell.getCellType() == CellType.STRING) {
                String dateStr = cell.getStringCellValue().trim();
                if (!dateStr.isEmpty()) {
                    // Intentar parsear diferentes formatos de fecha
                    return LocalDate.parse(dateStr);
                }
            }
        } catch (Exception e) {
            // Si no se puede parsear, retornar null
        }
        return null;
    }

    private Double getCellValueAsDouble(Row row, int columnIndex) {
        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return null;
        }

        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return cell.getNumericCellValue();
            } else if (cell.getCellType() == CellType.STRING) {
                String value = cell.getStringCellValue().trim();
                if (!value.isEmpty()) {
                    // Limpiar formato de moneda y separadores
                    // Ejemplo: "$6.230.000,00" -> "6230000.00"
                    // Remover símbolos de moneda y otros caracteres no numéricos (excepto coma y punto)
                    value = value.replaceAll("[^0-9,.]", "");
                    
                    // Detectar si hay coma (separador decimal en formato latino)
                    boolean hasComma = value.contains(",");
                    
                    // Remover todos los puntos (son separadores de miles)
                    value = value.replace(".", "");
                    
                    // Si había coma, reemplazarla por punto (separador decimal estándar)
                    if (hasComma) {
                        value = value.replace(",", ".");
                    }
                    
                    if (!value.isEmpty()) {
                        return Double.parseDouble(value);
                    }
                }
            } else if (cell.getCellType() == CellType.FORMULA) {
                // Si es una fórmula, intentar obtener el valor numérico
                if (cell.getCachedFormulaResultType() == CellType.NUMERIC) {
                    return cell.getNumericCellValue();
                } else if (cell.getCachedFormulaResultType() == CellType.STRING) {
                    String value = cell.getStringCellValue().trim();
                    if (!value.isEmpty()) {
                        // Limpiar formato de moneda y separadores (misma lógica que arriba)
                        value = value.replaceAll("[^0-9,.]", "");
                        boolean hasComma = value.contains(",");
                        value = value.replace(".", "");
                        if (hasComma) {
                            value = value.replace(",", ".");
                        }
                        if (!value.isEmpty()) {
                            return Double.parseDouble(value);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Si no se puede parsear, retornar null
        }
        return null;
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) {
            return true;
        }
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getCellValueAsString(row, i);
                if (value != null && !value.trim().isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Trunca un String a la longitud máxima permitida (255 caracteres).
     * Si el String es null, retorna null.
     * Si el String excede la longitud máxima, lo trunca y agrega "..." al final.
     */
    private String truncateString(String value) {
        if (value == null) {
            return null;
        }
        if (value.length() > MAX_STRING_LENGTH) {
            return value.substring(0, MAX_STRING_LENGTH - 3) + "...";
        }
        return value;
    }
}

