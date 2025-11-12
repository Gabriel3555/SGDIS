package com.sgdis.backend.email.web;

import com.sgdis.backend.email.application.dto.EmailRequest;
import com.sgdis.backend.email.application.dto.EmailResponse;
import com.sgdis.backend.email.application.dto.PasswordResetEmailRequest;
import com.sgdis.backend.email.application.port.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@Tag(name = "Email", description = "Email management endpoints")
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send a custom email", description = "Send a custom email to a recipient (Admin only)")
    public ResponseEntity<EmailResponse> sendEmail(@Valid @RequestBody EmailRequest emailRequest) {
        log.info("Sending email to: {}", emailRequest.getTo());
        
        boolean success = emailService.sendEmail(emailRequest);
        
        EmailResponse response = EmailResponse.builder()
                .success(success)
                .message(success ? "Email sent successfully" : "Failed to send email")
                .recipient(emailRequest.getTo())
                .build();
        
        return ResponseEntity
                .status(success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    @PostMapping("/password-reset")
    @Operation(summary = "Send password reset email", description = "Send a password reset email to a user")
    public ResponseEntity<EmailResponse> sendPasswordResetEmail(
            @Valid @RequestBody PasswordResetEmailRequest request) {
        log.info("Sending password reset email to: {}", request.getTo());
        
        boolean success = emailService.sendPasswordResetEmail(request);
        
        EmailResponse response = EmailResponse.builder()
                .success(success)
                .message(success ? "Password reset email sent successfully" : "Failed to send password reset email")
                .recipient(request.getTo())
                .build();
        
        return ResponseEntity
                .status(success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    @PostMapping("/welcome")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send welcome email", description = "Send a welcome email to a new user (Admin only)")
    public ResponseEntity<EmailResponse> sendWelcomeEmail(
            @RequestParam String email,
            @RequestParam String username) {
        log.info("Sending welcome email to: {}", email);
        
        boolean success = emailService.sendWelcomeEmail(email, username);
        
        EmailResponse response = EmailResponse.builder()
                .success(success)
                .message(success ? "Welcome email sent successfully" : "Failed to send welcome email")
                .recipient(email)
                .build();
        
        return ResponseEntity
                .status(success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    @PostMapping("/inventory-notification")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    @Operation(summary = "Send inventory notification", description = "Send an inventory notification email")
    public ResponseEntity<EmailResponse> sendInventoryNotification(
            @RequestParam String email,
            @RequestParam String inventoryName,
            @RequestParam String message) {
        log.info("Sending inventory notification to: {}", email);
        
        boolean success = emailService.sendInventoryNotification(email, inventoryName, message);
        
        EmailResponse response = EmailResponse.builder()
                .success(success)
                .message(success ? "Inventory notification sent successfully" : "Failed to send inventory notification")
                .recipient(email)
                .build();
        
        return ResponseEntity
                .status(success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    @GetMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Test email configuration", description = "Send a test email to verify configuration (Admin only)")
    public ResponseEntity<EmailResponse> testEmail(@RequestParam String email) {
        log.info("Sending test email to: {}", email);
        
        EmailRequest testRequest = EmailRequest.builder()
                .to(email)
                .subject("SGDIS - Test Email")
                .body("This is a test email from SGDIS. If you receive this, your email configuration is working correctly!")
                .isHtml(false)
                .build();
        
        boolean success = emailService.sendEmail(testRequest);
        
        EmailResponse response = EmailResponse.builder()
                .success(success)
                .message(success ? "Test email sent successfully" : "Failed to send test email")
                .recipient(email)
                .build();
        
        return ResponseEntity
                .status(success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}