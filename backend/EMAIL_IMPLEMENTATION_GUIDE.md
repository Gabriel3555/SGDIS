# Email Implementation Guide - SGDIS

## Overview
This guide explains how to use the email functionality implemented in the SGDIS Spring Boot application.

## Configuration

### Email Settings
The email configuration has been added to both `application-dev.properties` and `application-prod.properties`:

```properties
# Email Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=sgdis.sena@gmail.com
spring.mail.password=jkze swpi hcsl jynw
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000
```

**Note:** The password used is a Google App Password, not the regular Gmail password.

## Components Created

### 1. DTOs (Data Transfer Objects)

#### EmailRequest
```java
@Data
@Builder
public class EmailRequest {
    @NotBlank @Email
    private String to;
    @NotBlank
    private String subject;
    @NotBlank
    private String body;
    private boolean isHtml;
}
```

#### EmailResponse
```java
@Data
@Builder
public class EmailResponse {
    private boolean success;
    private String message;
    private String recipient;
}
```

#### PasswordResetEmailRequest
```java
@Data
@Builder
public class PasswordResetEmailRequest {
    @NotBlank @Email
    private String to;
    @NotBlank
    private String username;
    @NotBlank
    private String resetToken;
    @NotBlank
    private String resetUrl;
}
```

### 2. Service Interface and Implementation

#### EmailService Interface
Located at: `com.sgdis.backend.email.application.port.EmailService`

Methods:
- `sendEmail(EmailRequest)` - Send custom emails
- `sendPasswordResetEmail(PasswordResetEmailRequest)` - Send password reset emails
- `sendWelcomeEmail(String to, String username)` - Send welcome emails to new users
- `sendInventoryNotification(String to, String inventoryName, String message)` - Send inventory notifications

#### EmailServiceImpl
Located at: `com.sgdis.backend.email.application.service.EmailServiceImpl`

Features:
- Supports both plain text and HTML emails
- Pre-built HTML templates for different email types
- Professional styling with SENA branding
- Error handling and logging

### 3. REST Controller

#### EmailController
Located at: `com.sgdis.backend.email.web.EmailController`

Base URL: `/api/email`

## API Endpoints

### 1. Send Custom Email
**POST** `/api/email/send`
- **Authorization:** Admin only
- **Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Email content",
  "isHtml": false
}
```

### 2. Send Password Reset Email
**POST** `/api/email/password-reset`
- **Authorization:** Public
- **Request Body:**
```json
{
  "to": "user@example.com",
  "username": "johndoe",
  "resetToken": "abc123xyz",
  "resetUrl": "https://sgdis.com/reset-password?token=abc123xyz"
}
```

### 3. Send Welcome Email
**POST** `/api/email/welcome`
- **Authorization:** Admin only
- **Query Parameters:**
  - `email`: Recipient email
  - `username`: User's username

### 4. Send Inventory Notification
**POST** `/api/email/inventory-notification`
- **Authorization:** Admin or Warehouse role
- **Query Parameters:**
  - `email`: Recipient email
  - `inventoryName`: Name of the inventory
  - `message`: Notification message

### 5. Test Email Configuration
**GET** `/api/email/test`
- **Authorization:** Admin only
- **Query Parameters:**
  - `email`: Email address to send test email

## Usage Examples

### Using cURL

#### Test Email Configuration
```bash
curl -X GET "http://sgdis.cloud/api/email/test?email=your-email@example.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Send Custom Email
```bash
curl -X POST "http://sgdis.cloud/api/email/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test Email",
    "body": "This is a test email from SGDIS",
    "isHtml": false
  }'
```

#### Send Welcome Email
```bash
curl -X POST "http://sgdis.cloud/api/email/welcome?email=newuser@example.com&username=newuser" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. **Set Authorization:**
   - Type: Bearer Token
   - Token: Your JWT token from login

2. **Test Email:**
   - Method: GET
   - URL: `http://sgdis.cloud/api/email/test?email=your-email@example.com`

3. **Send Custom Email:**
   - Method: POST
   - URL: `http://sgdis.cloud/api/email/send`
   - Body (JSON):
   ```json
   {
     "to": "recipient@example.com",
     "subject": "Test Subject",
     "body": "<h1>Hello!</h1><p>This is an HTML email</p>",
     "isHtml": true
   }
   ```

### Using JavaScript (Frontend)

```javascript
// Test email configuration
async function testEmail(email) {
  const response = await fetch(`/api/email/test?email=${email}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Send welcome email
async function sendWelcomeEmail(email, username) {
  const response = await fetch(`/api/email/welcome?email=${email}&username=${username}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Send custom email
async function sendCustomEmail(emailData) {
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(emailData)
  });
  return await response.json();
}
```

## Integration with Existing Features

### 1. User Registration
Add to `AuthController` or `UserService`:
```java
@Autowired
private EmailService emailService;

// After user registration
emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
```

### 2. Password Reset
Add to password reset flow:
```java
String resetUrl = "https://your-domain.com/reset-password?token=" + resetToken;
PasswordResetEmailRequest request = PasswordResetEmailRequest.builder()
    .to(user.getEmail())
    .username(user.getUsername())
    .resetToken(resetToken)
    .resetUrl(resetUrl)
    .build();
emailService.sendPasswordResetEmail(request);
```

### 3. Inventory Notifications
Add to inventory management:
```java
emailService.sendInventoryNotification(
    manager.getEmail(),
    inventory.getName(),
    "Inventory has been updated"
);
```

## Testing

### 1. Start the Application
```bash
cd backend
mvn spring-boot:run
```

### 2. Access Swagger UI
Navigate to: `http://sgdis.cloud/swagger-ui.html`

### 3. Test Endpoints
1. Login to get JWT token
2. Use the token in Authorization header
3. Test the `/api/email/test` endpoint first
4. Try other email endpoints

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify the Google App Password is correct
   - Ensure 2-factor authentication is enabled on the Gmail account
   - Check if "Less secure app access" is enabled (if needed)

2. **Connection Timeout**
   - Check firewall settings
   - Verify port 587 is not blocked
   - Try using port 465 with SSL instead

3. **Email Not Received**
   - Check spam/junk folder
   - Verify recipient email address
   - Check application logs for errors

### Logs
Check application logs for email-related messages:
```
INFO  c.s.b.e.a.s.EmailServiceImpl - Sending email to: recipient@example.com
INFO  c.s.b.e.a.s.EmailServiceImpl - HTML email sent successfully to recipient@example.com
```

## Security Considerations

1. **App Password:** Never commit the app password to version control
2. **Environment Variables:** Use environment variables in production:
   ```properties
   spring.mail.username=${MAIL_USERNAME}
   spring.mail.password=${MAIL_PASSWORD}
   ```
3. **Rate Limiting:** Consider implementing rate limiting for email endpoints
4. **Authorization:** Email endpoints are protected by role-based access control

## Email Templates

The service includes pre-built HTML templates for:
- Password Reset (with branded styling)
- Welcome Email (with feature highlights)
- Inventory Notifications (with alert styling)

All templates use SENA branding colors (#39A900) and professional styling.

## Next Steps

1. Test the email functionality with your email address
2. Integrate email sending into user registration flow
3. Implement password reset functionality
4. Add email notifications for inventory changes
5. Consider adding email templates for other use cases

## Support

For issues or questions, contact the development team or check the application logs.