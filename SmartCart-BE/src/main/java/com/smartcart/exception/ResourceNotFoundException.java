package com.smartcart.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) { super(message); }
    public ResourceNotFoundException(String resource, Object id) {
        super("Khong tim thay " + resource + " voi id: " + id);
    }
}