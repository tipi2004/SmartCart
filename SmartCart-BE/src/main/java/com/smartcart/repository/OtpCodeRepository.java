package com.smartcart.repository;

import com.smartcart.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; // THÊM DÒNG NÀY
import java.util.UUID;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, UUID> {
    
    // Tìm tất cả mã OTP theo Email/SĐT (Dùng cho gửi mã)
    List<OtpCode> findByIdentifier(String identifier);

    // Tìm một mã OTP cụ thể (Dùng cho link xác thực)
    Optional<OtpCode> findByCode(String code);
}