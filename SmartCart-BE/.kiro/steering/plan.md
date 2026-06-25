# SmartCart Ă„â€Ă‚Â¢Ä‚Â¢Ă¢â‚¬ÂĂ‚Â¬Ä‚Â¢Ă¢â€Â¬Ă‚Â Ke hoach phat trien Backend

## Trang thai hien tai

### Hoan thanh
- Auth: dang ky, dang nhap, xac thuc email/SMS OTP, quen mat khau, Google OAuth2
- JWT Access Token + Refresh Token
- Entity: User, Shop, Product, Category, Cart, CartItem, OtpCode, RefreshToken
- Repository: Cart, CartItem, Product (co filter theo category)
- Swagger UI
- [Phase 1.1] ApiResponse<T> wrapper, GlobalExceptionHandler, response DTOs (ProductResponse, UserResponse, CategoryResponse)
- [Phase 1.2] Category API: GET /api/categories, GET /api/categories/{id}, GET /api/categories/{id}/products
- [Phase 1.3] Cart API: xem, them, cap nhat, xoa item, xoa toan bo gio hang

### Hoan thanh (bo sung)
- [Phase 1.4] Product: update, soft delete, filter + search
- [Phase 1.5] User profile: GET /me, PUT /me, PUT /me/password
- [Phase 1.6] Shop API: GET /shops/{id}, GET /shops/{id}/products, GET /shops/my, PUT /shops/my
- [Phase 2] Order / Checkout: POST /orders, GET /orders, GET /orders/{id}, PUT cancel/confirm
- [Phase 3] Chatbot: POST /chat, GET /chat/history, DELETE /chat/history (Gemini API)
- [Phase 4.1] Security: Logout API, doi mat khau
- [Phase 4.2] Admin API: quan ly users, products, orders

- [Phase 4.3] Notification: email xac nhan dat hang, thong bao don moi cho seller, xac nhan/huy don hang

### Chua lam / Con thieu
- Khong con task nao trong ke hoach hien tai

---

## Giai doan 1 - Hoan thien core API

### [DONE] 1.1 Chuan hoa Response
- ApiResponse<T> wrapper: { success, message, data }
- GlobalExceptionHandler (@RestControllerAdvice)
- ResourceNotFoundException, BusinessException
- Response DTOs: ProductResponse, UserResponse, CategoryResponse, CartResponse, CartItemResponse

### [DONE] 1.2 Category API
- GET /api/categories
- GET /api/categories/{id}
- GET /api/categories/{id}/products

### [DONE] 1.3 Cart API
- GET /api/cart
- POST /api/cart/items
- PUT /api/cart/items/{itemId}
- DELETE /api/cart/items/{itemId}
- DELETE /api/cart

### [DONE] 1.4 Product API - bo sung
- PUT /api/products/{id} - cap nhat san pham (chi chu shop)
- DELETE /api/products/{id} - an san pham (soft delete)
- GET /api/products?categoryId={id}&keyword={text} - filter + search

Files can sua:
- service/ProductService.java
- controller/ProductController.java

### [DONE] 1.5 User Profile API
- GET /api/users/me - tra UserResponse DTO
- PUT /api/users/me - cap nhat thong tin ca nhan

Files can sua/tao:
- dto/request/UpdateProfileRequest.java
- service/UserService.java
- controller/UserController.java

### [DONE] 1.6 Shop API
- GET /api/shops/my
- PUT /api/shops/my
- GET /api/shops/{id}/products

Files can tao:
- service/ShopService.java
- controller/ShopController.java

---

## Giai doan 2 - Order / Checkout

### [DONE] 2.1 Entity & Repository
- Order entity: id, userId, status (pending/confirmed/cancelled), totalAmount, createdAt
- OrderItem entity: orderId, productId, quantity, priceAtOrder

### [DONE] 2.2 Order API
- POST /api/orders
- GET /api/orders
- GET /api/orders/{id}
- PUT /api/orders/{id}/cancel
- PUT /api/orders/{id}/confirm (seller)

---

## Giai doan 3 - Chatbot Integration

### [DONE] 3.1 Thiet ke
Chatbot ho tro sinh vien:
- Tim kiem san pham bang ngon ngu tu nhien
- Hoi thong tin san pham
- Ho tro mua hang
- FAQ ve platform

### [DONE] 3.2 Approach
Tich hop LLM API ben ngoai (OpenAI / Gemini):
1. User gui message -> Backend nhan
2. Backend query DB lay context (san pham lien quan, thong tin user)
3. Gui context + message len LLM API
4. Tra response ve cho user

### [DONE] 3.3 Entity & Repository
- ChatSession: id, userId, createdAt
- ChatMessage: id, sessionId, role (user/assistant), content, createdAt

### [DONE] 3.4 Chatbot API
- POST /api/chat
- GET /api/chat/history
- DELETE /api/chat/history

Dependency can them:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

---

## Giai doan 4 - Production-ready

### [DONE] 4.1 Security
- Logout API: xoa refresh token
- Doi mat khau khi da dang nhap (PUT /api/users/me/password)

### [DONE] 4.2 Admin API
- GET /api/admin/users
- PUT /api/admin/users/{id}/status
- GET /api/admin/products
- PUT /api/admin/products/{id}/status
- GET /api/admin/orders
- GET /api/admin/orders/{id}

### [DONE] 4.3 Notification
- Email xac nhan dat hang thanh cong (cho buyer)
- Email thong bao don hang moi (cho seller)
- Email khi don hang duoc xac nhan (cho buyer)
- Email khi don hang bi huy (cho buyer)

---

## Thu tu thuc hien

```
Phase 1 (Core API)
  [DONE] 1.1 Chuan hoa Response + GlobalExceptionHandler
  [DONE] 1.2 Category API
  [DONE] 1.3 Cart API
  [DONE] 1.4 Product API bo sung
  [DONE] 1.5 User Profile API
  [DONE] 1.6 Shop API

Phase 2 (Order)
  [DONE] 2.1 Entity + Repository
  [DONE] 2.2 Order API

Phase 3 (Chatbot)
  [DONE] 3.1 Entity + Repository
  [DONE] 3.2 ChatbotService (Gemini API)
  [DONE] 3.3 Chat API

Phase 4 (Production)
  [DONE] 4.1 Security bo sung
  [DONE] 4.2 Admin API
  [DONE] 4.3 Notification
```

---

## Ghi chu ky thuat

- Tat ca response dung ApiResponse<T> wrapper
- Khong expose entity truc tiep ra API - luon map sang DTO
- Chatbot context nen include: san pham active, category, thong tin user
- LLM API key luu trong application.yml, khong hardcode
- Soft delete cho Product va Order (dung isActive / status field)
- Tao file bang PowerShell WriteAllText voi UTF8 khong BOM (fs_write tool bi loi)
