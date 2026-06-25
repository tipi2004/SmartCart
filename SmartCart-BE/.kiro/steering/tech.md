# Tech Stack

## Core

| Layer        | Công nghệ                           |
|--------------|-------------------------------------|
| Language     | Java 17                             |
| Framework    | Spring Boot 3.2.4                   |
| Build Tool   | Maven (spring-boot-maven-plugin)    |
| Database     | PostgreSQL 15                       |
| ORM          | Spring Data JPA / Hibernate         |

## Thư viện chính

| Thư viện                         | Mục đích                                     |
|----------------------------------|----------------------------------------------|
| Lombok                           | Giảm boilerplate (`@Data`, `@Builder`)       |
| Spring Security                  | Xác thực, phân quyền (`@PreAuthorize`)       |
| Spring OAuth2 Client             | Đăng nhập Google OAuth2                      |
| JJWT 0.11.5                      | Tạo và xác thực JWT                          |
| Spring Boot Starter Mail         | Gửi email qua Gmail SMTP                     |
| Cloudinary (`cloudinary-http44`) | Upload và lưu trữ ảnh sản phẩm               |
| SpringDoc OpenAPI 2.5.0          | Swagger UI tại `/swagger-ui.html`            |
| BCryptPasswordEncoder            | Hash mật khẩu                                |

## Hạ tầng

- **Docker Compose** — chạy PostgreSQL local (`postgres:15`, port `5432`)
- **Cloudinary** — lưu trữ ảnh sản phẩm
- **Gmail SMTP** — gửi email xác thực và đặt lại mật khẩu

## Cấu hình (`application.yml`)

| Key                              | Mục đích                          |
|----------------------------------|-----------------------------------|
| `spring.datasource`              | Kết nối PostgreSQL                |
| `spring.mail`                    | Gmail SMTP credentials            |
| `spring.security.oauth2`         | Google OAuth2 client ID/secret    |
| `jwt.secret` / `jwt.expiration`  | JWT signing key và TTL (ms)       |
| `cloudinary.*`                   | Cloud name, API key/secret        |
| `spring.jpa.hibernate.ddl-auto`  | `update` — tự cập nhật schema     |

## Lệnh thường dùng

```bash
# Build
mvn clean install

# Chạy ứng dụng
mvn spring-boot:run

# Chạy test
mvn test

# Đóng gói JAR (bỏ qua test)
mvn clean package -DskipTests

# Khởi động PostgreSQL local
docker-compose up -d

# Dừng Docker
docker-compose down
```

## API Docs

Swagger UI: `http://localhost:8080/swagger-ui.html`
