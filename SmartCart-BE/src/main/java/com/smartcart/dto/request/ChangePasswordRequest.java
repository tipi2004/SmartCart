package com.smartcart.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangePasswordRequest {
    @NotBlank(message = "Mat khau hien tai khong duoc de trong.")
    private String currentPassword;

    @NotBlank(message = "Mat khau moi khong duoc de trong.")
    @Size(min = 6, message = "Mat khau moi phai co it nhat 6 ky tu.")
    private String newPassword;

    @NotBlank(message = "Xac nhan mat khau khong duoc de trong.")
    private String confirmPassword;

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}
