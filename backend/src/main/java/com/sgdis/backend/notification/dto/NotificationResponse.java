package com.sgdis.backend.notification.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String message,
        String dataJson,
        boolean isRead,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {}

