package com.smartcart.service;

import com.smartcart.config.JwtTokenProvider;
import com.smartcart.dto.LoginRequest;
import com.smartcart.dto.RegisterRequest;
// THÊM IMPORT NÀY ĐỂ TRẢ VỀ 2 TOKEN
import com.smartcart.dto.TokenRefreshResponse; 
import com.smartcart.entity.OtpCode;
import com.smartcart.entity.RefreshToken;
import com.smartcart.entity.User;
import com.smartcart.repository.OtpCodeRepository;
import com.smartcart.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService; 
    private final JwtTokenProvider jwtTokenProvider;
    // 1. GỌI NHÀ MÁY IN THẺ GIA HẠN VÀO ĐÂY
    private final RefreshTokenService refreshTokenService; 
    private final SecureRandom secureRandom = new SecureRandom();

    // 2. CẬP NHẬT LẠI CONSTRUCTOR
    public AuthService(UserRepository userRepository, OtpCodeRepository otpCodeRepository, 
                       EmailService emailService, JwtTokenProvider jwtTokenProvider,
                       RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.otpCodeRepository = otpCodeRepository;
        this.emailService = emailService;
        this.jwtTokenProvider = jwtTokenProvider; 
        this.refreshTokenService = refreshTokenService; // Gán vào đây
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    // ==========================================
    // 1. ĐĂNG KÝ (Giữ nguyên)
    // ==========================================
    public String registerUser(RegisterRequest request) {
        // ... (Đoạn code cũ của bạn giữ nguyên 100%)
        boolean hasEmail = request.getEmail() != null && !request.getEmail().trim().isEmpty();
        boolean hasPhone = request.getPhone() != null && !request.getPhone().trim().isEmpty();

        if (!hasEmail && !hasPhone) {
            throw new RuntimeException("Vui lòng cung cấp Email hoặc Số điện thoại để đăng ký!");
        }

        if (hasEmail && userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng!");
        }
        if (hasPhone && userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new RuntimeException("Số điện thoại đã được sử dụng!");
        }

        User newUser = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("customer")
                .isActive(false)
                .build();
        userRepository.save(newUser);

        StringBuilder responseMessage = new StringBuilder("Đăng ký thành công! ");

        if (hasEmail) {
            String token = UUID.randomUUID().toString();
            OtpCode verificationToken = OtpCode.builder()
                    .identifier(request.getEmail())
                    .code(token)
                    .channel("EMAIL_LINK")
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .build();
            otpCodeRepository.save(verificationToken);
            emailService.sendVerificationLink(request.getEmail(), token);
            
            responseMessage.append("Vui lòng kiểm tra hộp thư email (").append(request.getEmail()).append(") để kích hoạt tài khoản. ");
        }

        if (hasPhone) {
            String otp = generateOtp();
            OtpCode smsOtp = OtpCode.builder()
                    .identifier(request.getPhone())
                    .code(otp)
                    .channel("SMS")
                    .expiresAt(LocalDateTime.now().plusMinutes(5))
                    .build();
            otpCodeRepository.save(smsOtp);
            responseMessage.append("Một mã OTP 6 số đã được gửi đến SĐT ").append(request.getPhone()).append(".");
        }

        return responseMessage.toString();
    }

    public String verifyPhoneOtp(com.smartcart.dto.VerifySmsRequest request) {
        List<OtpCode> codes = otpCodeRepository.findByIdentifier(request.getPhone());
        if (codes.isEmpty()) throw new RuntimeException("Không tìm thấy mã OTP nào cho số điện thoại này.");
        OtpCode latestCode = codes.stream().max(Comparator.comparing(OtpCode::getExpiresAt)).get();
        if (latestCode.getIsUsed() || !latestCode.getCode().equals(request.getOtpCode())) throw new RuntimeException("Mã OTP không chính xác hoặc đã được sử dụng!");
        if (latestCode.getExpiresAt().isBefore(LocalDateTime.now())) throw new RuntimeException("Mã OTP đã hết hạn!");

        User user = userRepository.findByPhone(request.getPhone()).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
        user.setIsActive(true);
        userRepository.save(user);

        latestCode.setIsUsed(true);
        otpCodeRepository.save(latestCode);

        return "Xác thực số điện thoại thành công! Bạn đã có thể đăng nhập.";
    }

    public String verifyEmailLink(String token) {
        Optional<OtpCode> tokenOpt = otpCodeRepository.findByCode(token);
        if (tokenOpt.isEmpty()) throw new RuntimeException("Đường link không hợp lệ hoặc không tồn tại!");
        OtpCode otpCode = tokenOpt.get();
        if (otpCode.getIsUsed()) throw new RuntimeException("Tài khoản này đã được kích hoạt trước đó rồi.");
        if (otpCode.getExpiresAt().isBefore(LocalDateTime.now())) throw new RuntimeException("Đường link đã hết hạn. Vui lòng yêu cầu gửi lại thư.");

        User user = userRepository.findByEmail(otpCode.getIdentifier()).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
        user.setIsActive(true);
        userRepository.save(user);

        otpCode.setIsUsed(true);
        otpCodeRepository.save(otpCode);

        return "Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công. Hãy quay lại trang web để đăng nhập.";
    }

    // ==========================================
    // 2. ĐĂNG NHẬP (ĐÃ "ĐỘ" LẠI ĐỂ TRẢ VỀ 2 THẺ)
    // ==========================================
    // Đổi kiểu trả về từ String sang TokenRefreshResponse
    public TokenRefreshResponse login(LoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();
        Optional<User> userOpt;

        if (username.contains("@")) {
            userOpt = userRepository.findByEmail(username);
        } else {
            userOpt = userRepository.findByPhone(username);
        }

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Tài khoản không tồn tại!");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email!");
        }

        // 1. Sinh Access Token (Thẻ ra vào)
        String accessToken = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
        
        // 2. Sinh Refresh Token (Thẻ gia hạn)
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        // 3. Đóng gói cả 2 thẻ ném về cho Frontend
        return new TokenRefreshResponse(accessToken, refreshToken.getToken());
    }

    public TokenRefreshResponse loginWithGoogle(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Khong tim thay tai khoan Google trong he thong."));

        String accessToken = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return new TokenRefreshResponse(accessToken, refreshToken.getToken());
    }

    // ==========================================
    // 3. QUÊN MẬT KHẨU (Giữ nguyên)
    // ==========================================
    public String requestPasswordReset(com.smartcart.dto.ForgotPasswordRequest request) {
        // ... (Đoạn code cũ của bạn giữ nguyên 100%)
        String identifier = request.getIdentifier();
        if (!request.getNewPassword().equals(request.getConfirmPassword())) throw new RuntimeException("Mật khẩu xác nhận không khớp!");

        Optional<User> userOpt;
        boolean isEmail = identifier.contains("@");
        if (isEmail) userOpt = userRepository.findByEmail(identifier);
        else userOpt = userRepository.findByPhone(identifier);

        if (userOpt.isEmpty()) throw new RuntimeException("Tài khoản không tồn tại trong hệ thống!");

        String tempEncodedPassword = passwordEncoder.encode(request.getNewPassword());
        String specializedIdentifier = identifier + "||" + tempEncodedPassword;

        if (isEmail) {
            String token = UUID.randomUUID().toString();
            OtpCode resetToken = OtpCode.builder()
                    .identifier(specializedIdentifier)
                    .code(token)
                    .channel("RESET_LINK")
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .build();
            otpCodeRepository.save(resetToken);
            emailService.sendResetPasswordLink(identifier, token);
            return "Vui lòng kiểm tra hộp thư email và bấm vào link để xác nhận đổi mật khẩu.";
        } else {
            String otp = generateOtp();
            OtpCode smsOtp = OtpCode.builder()
                    .identifier(specializedIdentifier)
                    .code(otp)
                    .channel("RESET_SMS")
                    .expiresAt(LocalDateTime.now().plusMinutes(5))
                    .build();
            otpCodeRepository.save(smsOtp);
            return "Vui lòng kiểm tra tin nhắn điện thoại để lấy mã OTP xác nhận.";
        }
    }

    public String verifyEmailResetLink(String token) {
        // ... (Đoạn code cũ của bạn giữ nguyên 100%)
        Optional<OtpCode> tokenOpt = otpCodeRepository.findByCode(token);
        if (tokenOpt.isEmpty()) throw new RuntimeException("Đường link không hợp lệ hoặc không tồn tại!");
        OtpCode otpCode = tokenOpt.get();
        if (otpCode.getIsUsed() || !otpCode.getChannel().equals("RESET_LINK")) throw new RuntimeException("Đường link này không hợp lệ hoặc đã được sử dụng.");
        if (otpCode.getExpiresAt().isBefore(LocalDateTime.now())) throw new RuntimeException("Đường link đã hết hạn.");

        String[] parts = otpCode.getIdentifier().split("\\|\\|");
        String email = parts[0];
        String newHashedPassword = parts[1];

        User user = userRepository.findByEmail(email).orElseThrow();
        user.setPasswordHash(newHashedPassword);
        userRepository.save(user);

        otpCode.setIsUsed(true);
        otpCodeRepository.save(otpCode);
        return "Đổi mật khẩu thành công! Bạn có thể quay lại trang đăng nhập.";
    }

    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user ->
                refreshTokenService.deleteByUserId(user.getId()));
    }

    public String verifySmsResetOtp(com.smartcart.dto.VerifySmsResetRequest request) {
        // ... (Đoạn code cũ của bạn giữ nguyên 100%)
        List<OtpCode> codes = otpCodeRepository.findAll().stream()
                .filter(code -> code.getIdentifier().startsWith(request.getPhone() + "||") && code.getChannel().equals("RESET_SMS"))
                .toList();
        if (codes.isEmpty()) throw new RuntimeException("Không tìm thấy mã OTP nào.");
        OtpCode latestCode = codes.stream().max(Comparator.comparing(OtpCode::getExpiresAt)).get();
        if (latestCode.getIsUsed() || !latestCode.getCode().equals(request.getOtpCode())) throw new RuntimeException("Mã OTP không chính xác hoặc đã được sử dụng!");
        if (latestCode.getExpiresAt().isBefore(LocalDateTime.now())) throw new RuntimeException("Mã OTP đã hết hạn!");

        String[] parts = latestCode.getIdentifier().split("\\|\\|");
        String phone = parts[0];
        String newHashedPassword = parts[1];

        User user = userRepository.findByPhone(phone).orElseThrow();
        user.setPasswordHash(newHashedPassword);
        userRepository.save(user);

        latestCode.setIsUsed(true);
        otpCodeRepository.save(latestCode);
        return "Đổi mật khẩu thành công! Bạn có thể quay lại trang đăng nhập.";
    }

    private String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }
}
