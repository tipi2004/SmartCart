package com.smartcart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Ho ten khong duoc de trong.")
    private String fullName;

    private String email;
    private String phone;

    @NotBlank(message = "Mat khau khong duoc de trong.")
    @Size(min = 6, message = "Mat khau phai co it nhat 6 ky tu.")
    private String password;
}
