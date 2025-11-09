package com.sgdis.backend.exception.userExceptions;

import java.util.regex.Pattern;

public final class EmailPolicy {
    private EmailPolicy() {}
    private static final Pattern ALLOWED =
            Pattern.compile("^[A-Za-z0-9._%+-]+@(soy\\.sena\\.edu\\.co|sena\\.edu\\.co)$");

    public static boolean isAllowed(String email) {
        return email != null && ALLOWED.matcher(email).matches();
    }
}
