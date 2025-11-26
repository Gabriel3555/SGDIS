package com.sgdis.backend.web;

import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Hidden
@Controller
public class ErrorController implements org.springframework.boot.web.servlet.error.ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object errorMessage = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);

        if (status != null) {
            Integer statusCode = Integer.valueOf(status.toString());

            // If it's a 403 Forbidden or Access Denied error, redirect to home
            if (statusCode == HttpStatus.FORBIDDEN.value() || 
                (errorMessage != null && errorMessage.toString().contains("Access Denied"))) {
                return "redirect:/";
            }
        }

        // For other errors, return default error page
        return "error.html";
    }
}