package com.smartcart.service;

import com.smartcart.dto.request.ChangePasswordRequest;
import com.smartcart.dto.request.UpdateProfileRequest;
import com.smartcart.dto.response.UserResponse;
import com.smartcart.entity.User;
import com.smartcart.exception.BusinessException;
import com.smartcart.exception.ResourceNotFoundException;
import com.smartcart.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            userRepository.findByPhone(request.getPhone()).ifPresent(existing -> {
                if (!existing.getId().equals(user.getId())) {
                    throw new BusinessException("So dien thoai nay da duoc su dung boi tai khoan khac.");
                }
            });
            user.setPhone(request.getPhone());
        }

        if (request.getShippingAddress() != null) {
            user.setShippingAddress(request.getShippingAddress().trim().isEmpty() ? null : request.getShippingAddress().trim());
        }

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("Mat khau xac nhan khong khop.");
        }
        if (request.getNewPassword().length() < 6) {
            throw new BusinessException("Mat khau moi phai co it nhat 6 ky tu.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException("Mat khau hien tai khong chinh xac.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
