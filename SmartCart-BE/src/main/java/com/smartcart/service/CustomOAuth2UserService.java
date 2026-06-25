package com.smartcart.service;

import com.smartcart.entity.User;
import com.smartcart.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Lấy thông tin user từ Google trả về
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // Kiểm tra xem User này đã tồn tại trong DB của SmartCart chưa
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            // Nếu chưa có, tự động tạo tài khoản mới cho họ
            User newUser = User.builder()
                    .fullName(name)
                    .email(email)
                    // Mật khẩu tạo ngẫu nhiên vì họ đăng nhập bằng Google, không dùng mật khẩu này
                    .passwordHash(new BCryptPasswordEncoder().encode(UUID.randomUUID().toString()))
                    .role("customer")
                    .isActive(true) // Tài khoản Google đã xác thực sẵn nên kích hoạt luôn
                    .build();
            userRepository.save(newUser);
            System.out.println("Đã đăng ký tài khoản mới tự động từ Google cho: " + email);
        } else {
            System.out.println("Tài khoản Google đã tồn tại trong hệ thống: " + email);
        }

        return oAuth2User;
    }
}