package com.smartcart.service;

import com.smartcart.dto.OtpRequest;
import com.smartcart.entity.OtpCode;
import com.smartcart.repository.OtpCodeRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    private final OtpCodeRepository otpCodeRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(OtpCodeRepository otpCodeRepository, EmailService emailService) {
        this.otpCodeRepository = otpCodeRepository;
        this.emailService = emailService;
    }

    public String generateAndSendOtp(OtpRequest request) {
        // 1. Tạo mã ngẫu nhiên 6 số (vd: 048291)
        String otp = generateOtp();

        // 2. Lưu lịch sử mã OTP này vào Database
        OtpCode otpCode = OtpCode.builder()
                .identifier(request.getIdentifier())
                .code(otp)
                .channel(request.getChannel())
                .expiresAt(LocalDateTime.now().plusMinutes(5)) // Sống được 5 phút
                .build();
        otpCodeRepository.save(otpCode);

        // 3. Xử lý gửi dựa trên Channel
        if ("EMAIL".equalsIgnoreCase(request.getChannel())) {
            // Gọi hàm gửi Email thật
            emailService.sendOtpEmail(request.getIdentifier(), otp);
            return "Đã gửi mã OTP qua Email thành công!";
            
        } else if ("SMS".equalsIgnoreCase(request.getChannel())) {
            // Giả lập gửi SMS cho đồ án (In ra Console)
            return "Đã gửi mã OTP qua SMS thành công!";
        } 
        
        throw new RuntimeException("Kênh gửi (channel) không hợp lệ. Vui lòng chọn EMAIL hoặc SMS.");
    }

    private String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }
}
