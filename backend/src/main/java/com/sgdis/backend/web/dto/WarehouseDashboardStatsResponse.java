package com.sgdis.backend.web.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseDashboardStatsResponse {
    
    // Estadísticas de Inventarios
    private InventoryStats inventoryStats;
    
    // Estadísticas de Transferencias
    private TransferStats transferStats;
    
    // Estadísticas de Préstamos
    private LoanStats loanStats;
    
    // Estadísticas de Cancelaciones
    private CancellationStats cancellationStats;
    
    // Estadísticas de Auditoría
    private AuditActionsStats auditActionsStats;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryStats {
        private Long totalInventories;
        private Long activeInventories;
        private Long inactiveInventories;
        private Long totalItems;
        @JsonFormat(shape = JsonFormat.Shape.NUMBER_FLOAT)
        private BigDecimal totalValue;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferStats {
        private Long total;
        private Long pending;
        private Long approved;
        private Long rejected;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoanStats {
        private Long total;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CancellationStats {
        private Long total;
        private Long pending;
        private Long approved;
        private Long rejected;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditActionsStats {
        private Long total;
    }
}

