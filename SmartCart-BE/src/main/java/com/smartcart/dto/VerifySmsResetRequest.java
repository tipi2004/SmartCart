package com.smartcart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifySmsResetRequest {
    @NotBlank(message = "So dien thoai khong duoc de trong.")
    private String phone;    // Hứng số điện thoại

    @NotBlank(message = "Ma OTP khong duoc de trong.")
    @Pattern(regexp = "\\d{6}", message = "Ma OTP phai gom 6 chu so.")
    private String otpCode;  // Hứng mã OTP 6 số
}
