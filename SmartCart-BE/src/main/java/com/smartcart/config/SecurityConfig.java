package com.smartcart.config;

import java.util.List;
import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.smartcart.dto.TokenRefreshResponse;
import com.smartcart.service.AuthService;
import com.smartcart.service.CustomOAuth2UserService;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final AuthService authService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final String allowedOrigins;
    private final String frontendUrl;
    private final String googleClientId;
    private final String googleClientSecret;

    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService,
                          AuthService authService,
                          JwtAuthenticationFilter jwtAuthenticationFilter,
                          @Value("${app.cors.allowed-origins}") String allowedOrigins,
                          @Value("${app.frontend-url}") String frontendUrl,
                          @Value("${app.google.client-id:}") String googleClientId,
                          @Value("${app.google.client-secret:}") String googleClientSecret) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.authService = authService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.allowedOrigins = allowedOrigins;
        this.frontendUrl = frontendUrl;
        this.googleClientId = googleClientId;
        this.googleClientSecret = googleClientSecret;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Kích hoạt cấu hình CORS (quan trọng cho Swagger)
            .csrf(csrf -> csrf.disable()) 
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)) 
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    // Khi không có quyền, trả về lỗi 401 đàng hoàng thay vì "Failed to fetch"
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Vui lòng đăng nhập (truyền JWT Token).");
                })
            )
            .authorizeHttpRequests(auth -> auth
                // Cấp quyền cho Auth, Swagger VÀ đường dẫn báo lỗi của Spring Boot
                .requestMatchers(
                    "/",
                    "/health",
                    "/api/auth/**",
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-resources/**",
                    "/webjars/**",
                    "/uploads/**",
                    "/error"
                ).permitAll()
                
                // Cấp quyền XEM sản phẩm cho tất cả mọi người
                .requestMatchers("/api/products", "/api/products/**").permitAll()
                .requestMatchers("/api/categories", "/api/categories/**").permitAll()
                .requestMatchers("/api/shops/{id}", "/api/shops/{id}/products").permitAll()
                .requestMatchers("/api/orders/payment-webhook").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/chat").permitAll()
                
                // Còn lại (Thêm, Sửa, Xóa) bắt buộc phải có Token
                .anyRequest().authenticated() 
            )
            ;

        if (isGoogleLoginEnabled()) {
            http.oauth2Login(oauth2 -> oauth2
                    .clientRegistrationRepository(clientRegistrationRepository())
                    .userInfoEndpoint(userInfo -> userInfo
                            .userService(customOAuth2UserService)
                    )
                    .successHandler((request, response, authentication) -> {
                        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
                        String email = oauthUser.getAttribute("email");
                        TokenRefreshResponse tokens = authService.loginWithGoogle(email);
                        String redirectUrl = frontendUrl + "?accessToken=" + tokens.getAccessToken()
                                + "&refreshToken=" + tokens.getRefreshToken();

                        response.sendRedirect(redirectUrl);
                    })
            );
        } else {
            http.oauth2Login(Customizer.withDefaults()).oauth2Login(oauth2 -> oauth2.disable());
        }

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Cấu hình CORS mở cửa cho mọi nguồn (để Swagger chạy mượt)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        if (!isGoogleLoginEnabled()) {
            return new InMemoryClientRegistrationRepository();
        }

        ClientRegistration google = ClientRegistration.withRegistrationId("google")
                .clientId(googleClientId)
                .clientSecret(googleClientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("profile", "email")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://www.googleapis.com/oauth2/v4/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName("sub")
                .clientName("Google")
                .build();

        return new InMemoryClientRegistrationRepository(google);
    }

    private boolean isGoogleLoginEnabled() {
        return googleClientId != null && !googleClientId.isBlank()
                && googleClientSecret != null && !googleClientSecret.isBlank();
    }
}
