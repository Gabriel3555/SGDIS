package com.sgdis.backend.email.application.port;

import com.sgdis.backend.email.application.dto.EmailRequest;
import com.sgdis.backend.email.application.dto.PasswordResetEmailRequest;

public interface EmailService {
    
    /**
     * Send a simple email
     * @param emailRequest the email request containing recipient, subject, and body
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendEmail(EmailRequest emailRequest);
    
    /**
     * Send a password reset email
     * @param request the password reset email request
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendPasswordResetEmail(PasswordResetEmailRequest request);
    
    /**
     * Send a welcome email to a new user
     * @param to recipient email address
     * @param username the username of the new user
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendWelcomeEmail(String to, String username);
    
    /**
     * Send an inventory notification email
     * @param to recipient email address
     * @param inventoryName the name of the inventory
     * @param message the notification message
     * @return true if email was sent successfully, false otherwise
     */
    boolean sendInventoryNotification(String to, String inventoryName, String message);
}