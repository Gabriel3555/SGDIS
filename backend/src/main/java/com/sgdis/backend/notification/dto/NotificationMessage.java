package com.sgdis.backend.notification.dto;

import java.time.LocalDateTime;

public record NotificationMessage(
        String type,
        String title,
        String message,
        Object data,
        LocalDateTime timestamp
) {
    public NotificationMessage(String type, String title, String message, Object data) {
        this(type, title, message, data, LocalDateTime.now());
    }
}

