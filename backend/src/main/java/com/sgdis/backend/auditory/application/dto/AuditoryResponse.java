package com.sgdis.backend.auditory.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Auditory record response")
public class AuditoryResponse {

    @Schema(description = "Auditory record ID")
    private Long id;

    @Schema(description = "Action description")
    private String action;

    @Schema(description = "Date and time of the action")
    private LocalDateTime date;

    @Schema(description = "Performer user ID")
    private Long performerId;

    @Schema(description = "Performer user full name")
    private String performerName;

    @Schema(description = "Performer user email")
    private String performerEmail;

    @Schema(description = "Institution ID")
    private Long institutionId;

    @Schema(description = "Institution name")
    private String institutionName;

    @Schema(description = "Regional ID")
    private Long regionalId;

    @Schema(description = "Regional name")
    private String regionalName;
}

