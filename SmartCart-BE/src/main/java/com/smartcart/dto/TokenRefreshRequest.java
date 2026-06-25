package com.smartcart.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TokenRefreshRequest {
    @NotBlank(message = "Refresh token khong duoc de trong.")
    private String refreshToken;
}
