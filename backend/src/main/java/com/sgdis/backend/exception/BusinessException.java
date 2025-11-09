package com.sgdis.backend.exception;

public abstract class BusinessException extends RuntimeException {
    private final String errorCode;

    protected BusinessException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
