package com.sgdis.backend.auditory.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Paginated auditory response")
public class PagedAuditoryResponse {

    @Schema(description = "List of auditory records for current page")
    private List<AuditoryResponse> auditories;

    @Schema(description = "Current page number (0-indexed)")
    private int currentPage;

    @Schema(description = "Total number of pages")
    private int totalPages;

    @Schema(description = "Total number of auditory records")
    private long totalAuditories;

    @Schema(description = "Number of records per page")
    private int pageSize;

    @Schema(description = "Whether this is the first page")
    private boolean first;

    @Schema(description = "Whether this is the last page")
    private boolean last;
}

