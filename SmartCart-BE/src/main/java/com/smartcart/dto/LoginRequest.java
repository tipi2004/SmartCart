package com.smartcart.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    // Dùng chung một biến username cho cả Email lẫn Số điện thoại
    @NotBlank(message = "Tai khoan khong duoc de trong.")
    private String username; 

    @NotBlank(message = "Mat khau khong duoc de trong.")
    private String password;
}
