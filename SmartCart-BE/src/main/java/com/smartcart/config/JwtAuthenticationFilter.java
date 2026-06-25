package com.smartcart.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            // 1. Lấy token từ request
            String jwt = getJwtFromRequest(request);

            // 2. Nếu có token và token hợp lệ
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String email = tokenProvider.getEmailFromToken(jwt);
                String role = tokenProvider.getRoleFromToken(jwt); // Đọc quyền từ thẻ

                // Set authority theo role (lowercase, khong prefix) de dung voi hasAuthority()
                java.util.List<org.springframework.security.core.GrantedAuthority> authorities = 
                    java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority(role.toLowerCase()));

                // Tạo đối tượng xác thực CÓ QUYỀN LỢI
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            System.out.println("Không thể thiết lập xác thực người dùng: " + ex.getMessage());
        }

        // Cho phép request đi tiếp tục (đến Controller hoặc bị chặn lại nếu không có quyền)
        filterChain.doFilter(request, response);
    }

    // Hàm hỗ trợ bóc tách Token từ Header của HTTP Request
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        // Token gửi lên thường có dạng: "Bearer eyJhbGciOi..."
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Cắt bỏ chữ "Bearer " để lấy đúng chuỗi token
        }
        return null;
    }
}