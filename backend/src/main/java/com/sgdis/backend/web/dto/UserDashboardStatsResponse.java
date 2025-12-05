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
public class UserDashboardStatsResponse {
    
    // Estadísticas de Items
    private ItemStats itemStats;
    
    // Estadísticas de Inventarios
    private InventoryStats inventoryStats;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemStats {
        private Long totalItems;
        private Long activeItems;
        private Long maintenanceItems;
        private Long inactiveItems;
        @JsonFormat(shape = JsonFormat.Shape.NUMBER_FLOAT)
        private BigDecimal totalValue;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryStats {
        private Long totalInventories;
    }
}

