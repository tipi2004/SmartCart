package com.smartcart.controller;

import com.smartcart.dto.ApiResponse;
import com.smartcart.dto.request.ChangePasswordRequest;
import com.smartcart.dto.request.UpdateProfileRequest;
import com.smartcart.dto.response.UserResponse;
import com.smartcart.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
@Tag(name = "2. User (Nguoi dung)", description = "Cac API can xac thuc bang JWT Token")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Lay thong tin ca nhan")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(principal.getName())));
    }

    @Operation(summary = "Cap nhat thong tin ca nhan")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            @RequestBody UpdateProfileRequest request, Principal principal) {
        UserResponse updated = userService.updateProfile(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Cap nhat thanh cong.", updated));
    }

    @Operation(summary = "Doi mat khau", description = "Yeu cau currentPassword, newPassword, confirmPassword.")
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request, Principal principal) {
        userService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Doi mat khau thanh cong."));
    }
}
