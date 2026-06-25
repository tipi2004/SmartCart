# Cấu trúc Project

## Layout thư mục

```
SmartCart-BE/
├── src/
│   ├── main/
│   │   ├── java/com/smartcart/   # Source code
│   │   └── resources/
│   │       ├── application.yml   # Toàn bộ cấu hình ứng dụng
│   │       └── init.sql          # Schema khởi tạo DB
│   └── test/
│       └── java/com/smartcart/   # Test (hiện chưa có)
├── database/
│   └── init.sql                  # SQL dùng bởi Docker Compose
├── docker-compose.yml            # PostgreSQL local
└── pom.xml                       # Maven build
```

## Package structure

```
com.smartcart/
├── config/         # Cấu hình Spring (Security, JWT, Cloudinary, Swagger)
├── controller/     # REST controllers
├── dto/            # Request/Response DTOs
├── entity/         # JPA entities
├── repository/     # Spring Data JPA repositories
├── service/        # Business logic
└── SmartCartApplication.java
```

## Trách nhiệm từng layer

### `config/`
- `SecurityConfig` — filter chain, CORS, OAuth2, public/protected routes
- `JwtAuthenticationFilter` — đọc và xác thực JWT từ header `Authorization`
- `JwtTokenProvider` — tạo/parse JWT (claims: email, role)
- `CloudinaryConfig` — Cloudinary SDK bean
- `SwaggerConfig` — cấu hình SpringDoc/OpenAPI

### `controller/`
- Chỉ nhận request, gọi service, trả `ResponseEntity` — không chứa business logic
- Constructor injection, không dùng `@Autowired`
- Mỗi class có `@Tag`, mỗi endpoint có `@Operation` (Swagger)
- Phân quyền bằng `@PreAuthorize`

### `dto/`
- POJO thuần, tách biệt theo từng use case
- **Không bao giờ trả entity trực tiếp** — luôn dùng DTO làm response
- Đặt tên rõ ràng: `XxxRequest`, `XxxResponse`

### `entity/`
- `@Entity`, `@Table` + Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor`
- ID luôn là `UUID` (`GenerationType.UUID` hoặc `AUTO`)
- Timestamp dùng `@CreationTimestamp` hoặc `@PrePersist`
- Lazy relation: thêm `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})`
- Tránh vòng lặp JSON: dùng `@JsonIgnore`

### `repository/`
- Extend `JpaRepository<Entity, UUID>`
- Query bằng method name hoặc `@Query`

### `service/`
- Toàn bộ business logic nằm ở đây
- Constructor injection only
- Ném `RuntimeException` với message rõ ràng; controller bắt và map sang HTTP response

## Quy ước code

| Quy tắc | Chi tiết |
|---------|----------|
| ID | Luôn dùng `UUID`, không dùng auto-increment |
| Slug | Tạo từ tiếng Việt bằng NFD normalization + bỏ dấu |
| Role | Lưu dạng string thường: `"customer"`, `"seller"` |
| Error handling | Service ném `RuntimeException` → controller trả `400 Bad Request` |
| Session | Stateless — JWT only, không dùng session |
| Injection | Constructor injection only, không dùng `@Autowired` field injection |
| Response | Luôn dùng DTO, không expose entity ra ngoài API |
| Multipart | Dùng `@RequestParam` riêng lẻ (không `@ModelAttribute`) để Swagger hiển thị đúng |
| Frontend | Chưa có — không generate frontend code khi chưa được yêu cầu |
