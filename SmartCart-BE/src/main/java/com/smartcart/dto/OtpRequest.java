package com.smartcart.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpRequest {
    @NotBlank(message = "Email hoac so dien thoai khong duoc de trong.")
    private String identifier; // Email hoặc SĐT (vd: a@gmail.com)

    @NotBlank(message = "Kenh gui OTP khong duoc de trong.")
    private String channel;    // "EMAIL" hoặc "SMS"
}
