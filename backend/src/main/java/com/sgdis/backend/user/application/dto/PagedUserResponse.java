package com.sgdis.backend.user.application.dto;

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
@Schema(description = "Paginated user response")
public class PagedUserResponse {

    @Schema(description = "List of users for current page")
    private List<UserResponse> users;

    @Schema(description = "Current page number (0-indexed)")
    private int currentPage;

    @Schema(description = "Total number of pages")
    private int totalPages;

    @Schema(description = "Total number of users")
    private long totalUsers;

    @Schema(description = "Number of users per page")
    private int pageSize;

    @Schema(description = "Whether this is the first page")
    private boolean first;

    @Schema(description = "Whether this is the last page")
    private boolean last;
}

