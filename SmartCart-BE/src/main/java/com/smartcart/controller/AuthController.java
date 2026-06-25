package com.smartcart.controller;

import com.smartcart.config.JwtTokenProvider;
import com.smartcart.dto.*;
import com.smartcart.exception.BusinessException;
import com.smartcart.service.AuthService;
import com.smartcart.service.OtpService;
import com.smartcart.service.RefreshTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.net.URI;
import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "1. Authentication (Xac thuc)", description = "Dang ky, Dang nhap, Quen mat khau, Dang xuat")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenProvider jwtTokenProvider;
    private final String frontendUrl;

    public AuthController(AuthService authService, OtpService otpService,
                          RefreshTokenService refreshTokenService, JwtTokenProvider jwtTokenProvider,
                          @Value("${app.frontend-url}") String frontendUrl) {
        this.authService = authService;
        this.otpService = otpService;
        this.refreshTokenService = refreshTokenService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.frontendUrl = frontendUrl;
    }

    @Operation(summary = "Dang ky tai khoan")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest request) {
        String message = authService.registerUser(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @Operation(summary = "Xac nhan Link Email (Kich hoat)")
    @GetMapping("/verify")
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        String message = authService.verifyEmailLink(token);
        return ResponseEntity.ok("<h1>" + message + "</h1>");
    }

    @Operation(summary = "Xac nhan SMS (Kich hoat)")
    @PostMapping("/verify-sms")
    public ResponseEntity<ApiResponse<String>> verifySms(@Valid @RequestBody VerifySmsRequest request) {
        String message = authService.verifyPhoneOtp(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @Operation(summary = "Dang nhap", description = "Tra ve Access Token + Refresh Token.")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> login(@Valid @RequestBody LoginRequest request) {
        TokenRefreshResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Doi Token moi")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        TokenRefreshResponse response = refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshToken -> {
                    refreshTokenService.verifyExpiration(refreshToken);
                    return refreshToken;
                })
                .map(com.smartcart.entity.RefreshToken::getUser)
                .map(user -> {
                    String newAccessToken = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
                    return new TokenRefreshResponse(newAccessToken, requestRefreshToken);
                })
                .orElseThrow(() -> new BusinessException("Refresh Token khong ton tai trong he thong!"));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Dang xuat", description = "Xoa Refresh Token. Access Token se tu het han theo TTL.")
    @PostMapping("/logout")
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<ApiResponse<String>> logout(Principal principal) {
        authService.logout(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Dang xuat thanh cong."));
    }

    @Operation(summary = "Gui OTP")
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody OtpRequest request) {
        String message = otpService.generateAndSendOtp(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @Operation(summary = "Yeu cau Quen mat khau")
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String message = authService.requestPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @Operation(summary = "Xac nhan Link Doi mat khau")
    @GetMapping("/verify-reset-email")
    public ResponseEntity<String> verifyResetEmail(@RequestParam String token) {
        String message = authService.verifyEmailResetLink(token);
        return ResponseEntity.ok("<h1>" + message + "</h1>");
    }

    @Operation(summary = "Xac nhan SMS Doi mat khau")
    @PostMapping("/verify-reset-sms")
    public ResponseEntity<ApiResponse<String>> verifyResetSms(@Valid @RequestBody VerifySmsResetRequest request) {
        String message = authService.verifySmsResetOtp(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @Operation(summary = "Trang bao thanh cong Google")
    @GetMapping("/google-success")
    public ResponseEntity<Void> googleSuccess(OAuth2AuthenticationToken authentication) {
        String email = authentication.getPrincipal().getAttribute("email");
        TokenRefreshResponse response = authService.loginWithGoogle(email);
        String redirectUrl = frontendUrl + "?accessToken=" + response.getAccessToken()
                + "&refreshToken=" + response.getRefreshToken();

        return ResponseEntity.status(302).location(URI.create(redirectUrl)).build();
    }
}
