# SmartCart — Tổng quan sản phẩm

SmartCart là nền tảng thương mại điện tử dành cho sinh viên (chợ sinh viên), cho phép mua bán đồ cũ, giáo trình và các mặt hàng trong cộng đồng campus.

**Phạm vi hiện tại:** Backend-only (Spring Boot REST API). Frontend chưa được phát triển.

## Các khái niệm cốt lõi

- **User** — đăng ký qua email (link kích hoạt) hoặc SĐT (OTP SMS), hỗ trợ Google OAuth2
- **Shop** — tự động tạo khi user đăng bán sản phẩm lần đầu
- **Product** — thuộc một shop và một category, hỗ trợ upload ảnh qua Cloudinary, có slug URL
- **Cart / CartItem** — giỏ hàng của người mua
- **OTP / RefreshToken** — xác thực tài khoản, đặt lại mật khẩu, quản lý phiên JWT

## Vai trò người dùng

| Role       | Mô tả                              |
|------------|------------------------------------|
| `customer` | Mặc định; xem và mua hàng          |
| `seller`   | Đăng bán sản phẩm                  |
| `admin`    | Quản trị nền tảng (dự kiến)        |

## Luồng chính

1. **Đăng ký** → xác thực email link hoặc OTP SMS → tài khoản kích hoạt
2. **Đăng nhập** → trả về Access Token (JWT) + Refresh Token
3. **Quên mật khẩu** → xác thực email link hoặc OTP SMS → cập nhật mật khẩu
4. **Đăng bán** → tự tạo shop nếu chưa có → upload ảnh Cloudinary → lưu sản phẩm

## Quy tắc AI assistant

- Giao tiếp bằng **tiếng Việt**, ngắn gọn, đủ ý
- Đưa solution trước, giải thích sau nếu cần
- **Không generate frontend code** khi chưa được yêu cầu
- **Không tạo file hoặc code không cần thiết**
- Giữ nguyên cấu trúc project hiện tại
- Chỉ viết production-ready code

