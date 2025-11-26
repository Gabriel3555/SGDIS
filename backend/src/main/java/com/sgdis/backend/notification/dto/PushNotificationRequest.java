package com.sgdis.backend.notification.dto;

import java.util.Map;

public record PushNotificationRequest(
        String to,
        String title,
        String body,
        Map<String, Object> data,
        String sound,
        String priority
) {
    public PushNotificationRequest(String to, String title, String body, Map<String, Object> data) {
        this(to, title, body, data, "default", "high");
    }
}

