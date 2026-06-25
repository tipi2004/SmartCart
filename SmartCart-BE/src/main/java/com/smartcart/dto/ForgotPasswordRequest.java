package com.smartcart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Email hoac so dien thoai khong duoc de trong.")
    private String identifier;       // Hứng Email hoặc Số điện thoại

    @NotBlank(message = "Mat khau moi khong duoc de trong.")
    @Size(min = 6, message = "Mat khau moi phai co it nhat 6 ky tu.")
    private String newPassword;      // Hứng Mật khẩu mới

    @NotBlank(message = "Xac nhan mat khau khong duoc de trong.")
    private String confirmPassword;  // Hứng Xác nhận mật khẩu mới
}
