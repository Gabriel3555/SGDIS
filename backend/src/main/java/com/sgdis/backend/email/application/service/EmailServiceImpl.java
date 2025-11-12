package com.sgdis.backend.email.application.service;

import com.sgdis.backend.email.application.dto.EmailRequest;
import com.sgdis.backend.email.application.dto.PasswordResetEmailRequest;
import com.sgdis.backend.email.application.port.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    
    @Override
    public boolean sendEmail(EmailRequest emailRequest) {
        try {
            if (emailRequest.isHtml()) {
                return sendHtmlEmail(emailRequest.getTo(), emailRequest.getSubject(), emailRequest.getBody());
            } else {
                return sendSimpleEmail(emailRequest.getTo(), emailRequest.getSubject(), emailRequest.getBody());
            }
        } catch (Exception e) {
            log.error("Error sending email to {}: {}", emailRequest.getTo(), e.getMessage());
            return false;
        }
    }
    
    @Override
    public boolean sendPasswordResetEmail(PasswordResetEmailRequest request) {
        String subject = "SGDIS - Recuperación de Contraseña";
        String htmlBody = buildPasswordResetEmailBody(request.getUsername(), request.getResetUrl());
        
        try {
            return sendHtmlEmail(request.getTo(), subject, htmlBody);
        } catch (Exception e) {
            log.error("Error sending password reset email to {}: {}", request.getTo(), e.getMessage());
            return false;
        }
    }
    
    @Override
    public boolean sendWelcomeEmail(String to, String username) {
        String subject = "¡Bienvenido a SGDIS!";
        String htmlBody = buildWelcomeEmailBody(username);
        
        try {
            return sendHtmlEmail(to, subject, htmlBody);
        } catch (Exception e) {
            log.error("Error sending welcome email to {}: {}", to, e.getMessage());
            return false;
        }
    }
    
    @Override
    public boolean sendInventoryNotification(String to, String inventoryName, String message) {
        String subject = "SGDIS - Notificación de Inventario: " + inventoryName;
        String htmlBody = buildInventoryNotificationBody(inventoryName, message);
        
        try {
            return sendHtmlEmail(to, subject, htmlBody);
        } catch (Exception e) {
            log.error("Error sending inventory notification to {}: {}", to, e.getMessage());
            return false;
        }
    }
    
    private boolean sendSimpleEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("sgdis.sena@gmail.com");
            
            mailSender.send(message);
            log.info("Simple email sent successfully to {}", to);
            return true;
        } catch (Exception e) {
            log.error("Error sending simple email to {}: {}", to, e.getMessage());
            return false;
        }
    }
    
    private boolean sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.setFrom("sgdis.sena@gmail.com");
            
            mailSender.send(message);
            log.info("HTML email sent successfully to {}", to);
            return true;
        } catch (MessagingException e) {
            log.error("Error sending HTML email to {}: {}", to, e.getMessage());
            return false;
        }
    }
    
    private String buildPasswordResetEmailBody(String username, String resetUrl) {
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Recuperar Contraseña - SGDIS</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background-color: #fdfdfd;
                        line-height: 1.6;
                        color: #333;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(10px);
                        border-radius: 16px;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        overflow: hidden;
                    }
                    .header {
                        background: linear-gradient(135deg, #39A900 0%%, #2D8000 100%%);
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .logo-container {
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                    }
                    .logo-image {
                        width: 64px;
                        height: 64px;
                        margin-bottom: 12px;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }
                    .logo-text {
                        font-size: 32px;
                        font-weight: 700;
                        color: white;
                        margin: 0;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .subtitle {
                        font-size: 16px;
                        color: rgba(255, 255, 255, 0.95);
                        margin: 8px 0 0 0;
                        font-weight: 500;
                    }
                    .divider {
                        width: 64px;
                        height: 4px;
                        background-color: white;
                        border-radius: 2px;
                        margin: 16px auto 0;
                    }
                    .content {
                        padding: 40px 30px;
                        background-color: #ffffff;
                    }
                    .greeting {
                        font-size: 24px;
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 20px;
                    }
                    .message {
                        font-size: 15px;
                        color: #4b5563;
                        margin-bottom: 16px;
                        line-height: 1.7;
                    }
                    .button-container {
                        text-align: center;
                        margin: 32px 0;
                    }
                    .reset-button {
                        display: inline-block;
                        padding: 16px 40px;
                        background: linear-gradient(135deg, #39A900 0%%, #2D8000 100%%);
                        color: white;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: 600;
                        font-size: 16px;
                        box-shadow: 0 10px 25px -5px rgba(57, 169, 0, 0.3);
                        transition: all 0.3s ease;
                    }
                    .reset-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 15px 30px -5px rgba(57, 169, 0, 0.4);
                    }
                    .url-box {
                        background-color: #E8F5E8;
                        border-left: 4px solid #39A900;
                        padding: 16px;
                        border-radius: 8px;
                        margin: 24px 0;
                        word-break: break-all;
                    }
                    .url-text {
                        font-size: 13px;
                        color: #2D8000;
                        font-family: 'Courier New', monospace;
                    }
                    .warning {
                        background-color: #FFF3CD;
                        border-left: 4px solid #FF6B00;
                        padding: 16px;
                        border-radius: 8px;
                        margin: 24px 0;
                    }
                    .warning-text {
                        font-size: 14px;
                        color: #856404;
                        font-weight: 600;
                    }
                    .info-box {
                        background-color: #f9fafb;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 24px 0;
                    }
                    .info-text {
                        font-size: 13px;
                        color: #6b7280;
                        line-height: 1.6;
                    }
                    .footer {
                        background-color: #f9fafb;
                        padding: 30px;
                        text-align: center;
                        border-top: 1px solid #e5e7eb;
                    }
                    .footer-text {
                        font-size: 13px;
                        color: #6b7280;
                        margin: 8px 0;
                    }
                    .footer-link {
                        color: #39A900;
                        text-decoration: none;
                        font-weight: 500;
                    }
                    .footer-link:hover {
                        color: #2D8000;
                    }
                    .copyright {
                        font-size: 12px;
                        color: #9ca3af;
                        margin-top: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-container">
                            <img src="https://sgdis.cloud/svg/box.png" alt="SGDIS Logo" class="logo-image">
                            <h1 class="logo-text">SGDIS</h1>
                        </div>
                        <p class="subtitle">Sistema de Gestión de Inventario</p>
                        <p class="subtitle" style="font-size: 14px; margin-top: 4px;">Servicio Nacional de Aprendizaje - SENA</p>
                        <div class="divider"></div>
                    </div>                    
                    <div class="content">
                        <h2 class="greeting">¡Hola, %s!</h2>                        
                        <p class="message">
                            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en SGDIS.
                        </p>                        
                        <p class="message">
                            Haz clic en el botón de abajo para crear una nueva contraseña:
                        </p>                        
                        <div class="button-container">
                            <a href="%s" class="reset-button">
                                🔐 Restablecer Contraseña
                            </a>
                        </div>                                                                      
                        <div class="warning">
                            <p class="warning-text">
                                ⏰ Este enlace expirará en 24 horas por seguridad.
                            </p>
                        </div>                                                                      
                        <div class="info-box" style="margin-top: 24px;">
                            <p class="info-text">
                                <strong>💡 Consejo de seguridad:</strong><br>
                                Nunca compartas tu contraseña con nadie. El equipo de SGDIS nunca te pedirá tu contraseña por correo electrónico.
                            </p>
                        </div>
                    </div>
                    
                    <div class="footer">                       
                        <p class="footer-text" style="margin-top: 16px;">
                            Este es un correo automático, por favor no respondas a este mensaje.
                        </p>
                        <p class="copyright">
                            © 2025 SENA - Servicio Nacional de Aprendizaje<br>                            
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(username, resetUrl, resetUrl);
    }
    
    private String buildWelcomeEmailBody(String username) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #39A900; color: white; padding: 20px; text-align: center; display: flex; flex-direction: column; align-items: center; }
                    .logo-image { width: 64px; height: 64px; margin-bottom: 12px; border-radius: 8px; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                    .feature { margin: 15px 0; padding: 10px; background-color: white; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://sgdis.cloud/svg/box.png" alt="SGDIS Logo" class="logo-image">
                        <h1>¡Bienvenido a SGDIS!</h1>
                    </div>
                    <div class="content">
                        <h2>Hola %s,</h2>
                        <p>¡Nos complace darte la bienvenida al Sistema de Gestión de Inventarios SGDIS!</p>
                        <p>Tu cuenta ha sido creada exitosamente. Ahora puedes acceder a todas las funcionalidades del sistema:</p>
                        <div class="feature">
                            <strong>📦 Gestión de Inventarios</strong>
                            <p>Administra y controla todos tus inventarios de manera eficiente.</p>
                        </div>
                        <div class="feature">
                            <strong>👥 Gestión de Usuarios</strong>
                            <p>Colabora con tu equipo y asigna permisos según sea necesario.</p>
                        </div>
                        <div class="feature">
                            <strong>📊 Reportes y Análisis</strong>
                            <p>Genera reportes detallados y obtén insights valiosos.</p>
                        </div>
                        <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                        <p>¡Esperamos que disfrutes usando SGDIS!</p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                        <p>&copy; 2025 SGDIS - SENA. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(username);
    }
    
    private String buildInventoryNotificationBody(String inventoryName, String message) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #39A900; color: white; padding: 20px; text-align: center; display: flex; flex-direction: column; align-items: center; }
                    .logo-image { width: 64px; height: 64px; margin-bottom: 12px; border-radius: 8px; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
                    .notification { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://sgdis.cloud/svg/box.png" alt="SGDIS Logo" class="logo-image">
                        <h1>SGDIS - Notificación de Inventario</h1>
                    </div>
                    <div class="content">
                        <h2>Notificación de Inventario</h2>
                        <p><strong>Inventario:</strong> %s</p>
                        <div class="notification">
                            <p><strong>Mensaje:</strong></p>
                            <p>%s</p>
                        </div>
                        <p>Por favor, revisa el sistema para más detalles.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                        <p>&copy; 2025 SGDIS - SENA. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(inventoryName, message);
    }
}