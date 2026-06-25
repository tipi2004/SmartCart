package com.smartcart.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String identifier; // Nhập Email hoặc Số điện thoại
    private String newPassword;    // Mã OTP vừa nhận được
    private String confirmPassword;// Mật khẩu mới muốn đổi
}