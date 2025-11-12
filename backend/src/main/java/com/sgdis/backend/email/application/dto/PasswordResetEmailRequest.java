package com.sgdis.backend.email.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetEmailRequest {
    
    @NotBlank(message = "Recipient email is required")
    @Email(message = "Invalid email format")
    private String to;
    
    @NotBlank(message = "Username is required")
    private String username;
    
    @NotBlank(message = "Reset token is required")
    private String resetToken;
    
    @NotBlank(message = "Reset URL is required")
    private String resetUrl;
}