# Tài liệu Yêu cầu — SmartCart Frontend

## Giới thiệu

SmartCart Frontend là ứng dụng web dành cho sinh viên, cung cấp giao diện mua bán đồ cũ, giáo trình và các mặt hàng trong cộng đồng campus. Frontend được xây dựng bằng React 18 + TypeScript, kết nối với SmartCart Backend (Spring Boot REST API tại `localhost:8080`). Giao diện mang phong cách trẻ trung, năng động với hiệu ứng 3D nổi bật, hỗ trợ đầy đủ ba vai trò: customer, seller và admin.

---

## Bảng thuật ngữ

- **App**: Ứng dụng SmartCart Frontend (React SPA)
- **API_Client**: Module Axios được cấu hình sẵn base URL, interceptor JWT
- **Auth_Store**: Zustand store quản lý trạng thái xác thực (access token, refresh token, thông tin user)
- **Cart_Store**: Zustand store quản lý trạng thái giỏ hàng phía client
- **Router**: React Router v6 quản lý điều hướng
- **Query_Client**: TanStack Query client quản lý server state, cache và refetch
- **Scene_3D**: Component React Three Fiber render hiệu ứng 3D
- **Chat_Widget**: Component chatbot AI nổi (floating) tích hợp Gemini
- **Customer**: Người dùng với role `customer` — xem và mua hàng
- **Seller**: Người dùng với role `seller` — đăng bán sản phẩm, quản lý shop
- **Admin**: Người dùng với role `admin` — quản trị nền tảng
- **Access_Token**: JWT ngắn hạn dùng để xác thực request
- **Refresh_Token**: JWT dài hạn dùng để lấy Access_Token mới
- **OTP**: Mã xác thực một lần gửi qua email hoặc SMS
- **Product**: Sản phẩm đăng bán trên nền tảng
- **Shop**: Gian hàng của Seller
- **Order**: Đơn hàng được tạo từ giỏ hàng
- **Category**: Danh mục phân loại sản phẩm

---

## Yêu cầu

### Yêu cầu 1: Xác thực và Quản lý phiên đăng nhập

**User Story:** Là một sinh viên, tôi muốn đăng ký và đăng nhập vào SmartCart, để có thể mua bán hàng trong campus.

#### Tiêu chí chấp nhận

1. THE App SHALL cung cấp trang đăng ký với form nhập email, mật khẩu, họ tên và số điện thoại.
2. WHEN người dùng gửi form đăng ký hợp lệ, THE App SHALL gọi `POST /api/auth/register` và hiển thị thông báo yêu cầu xác thực OTP.
3. WHEN người dùng nhập OTP hợp lệ, THE App SHALL gọi API xác thực OTP và chuyển hướng đến trang đăng nhập.
4. IF người dùng nhập OTP sai hoặc hết hạn, THEN THE App SHALL hiển thị thông báo lỗi cụ thể và cho phép yêu cầu gửi lại OTP.
5. THE App SHALL cung cấp trang đăng nhập với form nhập email và mật khẩu.
6. WHEN người dùng đăng nhập thành công, THE App SHALL lưu Access_Token và Refresh_Token vào Auth_Store và chuyển hướng về trang chủ.
7. THE App SHALL cung cấp nút "Đăng nhập với Google" gọi luồng Google OAuth2.
8. WHEN Access_Token hết hạn, THE API_Client SHALL tự động gọi `POST /api/auth/refresh` với Refresh_Token để lấy Access_Token mới mà không làm gián đoạn request đang chờ.
9. IF Refresh_Token hết hạn hoặc không hợp lệ, THEN THE App SHALL xóa Auth_Store và chuyển hướng người dùng về trang đăng nhập.
10. WHEN người dùng nhấn đăng xuất, THE App SHALL gọi `POST /api/auth/logout`, xóa Auth_Store và chuyển hướng về trang chủ.
11. THE App SHALL cung cấp luồng quên mật khẩu: nhập email/SĐT → nhận OTP → đặt lại mật khẩu mới.
12. WHILE người dùng chưa đăng nhập, THE Router SHALL chuyển hướng các route được bảo vệ về trang đăng nhập.

---

### Yêu cầu 2: Trang chủ với hiệu ứng 3D

**User Story:** Là một sinh viên, tôi muốn thấy trang chủ hấp dẫn với hiệu ứng 3D, để có trải nghiệm mua sắm thú vị và khám phá sản phẩm dễ dàng.

#### Tiêu chí chấp nhận

1. THE App SHALL hiển thị trang chủ với hero banner sử dụng Scene_3D (React Three Fiber) làm nền động.
2. THE Scene_3D SHALL render mô hình 3D hoặc particle system phản hồi với chuyển động chuột của người dùng.
3. THE App SHALL hiển thị danh sách danh mục sản phẩm lấy từ `GET /api/categories` dưới dạng card có thể nhấn.
4. THE App SHALL hiển thị lưới sản phẩm nổi bật lấy từ `GET /api/products` với phân trang hoặc infinite scroll.
5. WHEN người dùng nhấn vào một danh mục, THE Router SHALL điều hướng đến trang danh sách sản phẩm đã lọc theo danh mục đó.
6. WHEN người dùng nhấn vào một sản phẩm, THE Router SHALL điều hướng đến trang chi tiết sản phẩm.
7. THE App SHALL hiển thị thanh tìm kiếm nổi bật trên hero banner cho phép nhập từ khóa.
8. WHEN người dùng nhập từ khóa và nhấn tìm kiếm, THE Router SHALL điều hướng đến trang danh sách sản phẩm với tham số `keyword` tương ứng.
9. THE App SHALL responsive trên màn hình mobile (≥ 320px), tablet (≥ 768px) và desktop (≥ 1024px).

---

### Yêu cầu 3: Danh sách và Tìm kiếm Sản phẩm

**User Story:** Là một sinh viên, tôi muốn tìm kiếm và lọc sản phẩm, để nhanh chóng tìm được đồ cần mua.

#### Tiêu chí chấp nhận

1. THE App SHALL hiển thị trang danh sách sản phẩm với lưới card sản phẩm, mỗi card gồm ảnh, tên, giá và tên shop.
2. THE Query_Client SHALL gọi `GET /api/products` với các tham số `keyword`, `categoryId` từ URL query string.
3. WHEN người dùng thay đổi bộ lọc danh mục, THE App SHALL cập nhật URL query string và refetch danh sách sản phẩm.
4. WHEN người dùng nhập từ khóa tìm kiếm, THE App SHALL debounce 400ms trước khi gọi API để tránh gọi quá nhiều request.
5. THE App SHALL hiển thị skeleton loading khi đang tải dữ liệu sản phẩm.
6. IF `GET /api/products` trả về danh sách rỗng, THEN THE App SHALL hiển thị thông báo "Không tìm thấy sản phẩm phù hợp" kèm gợi ý tìm kiếm khác.
7. THE App SHALL hỗ trợ sắp xếp sản phẩm theo giá tăng dần, giá giảm dần và mới nhất.
8. THE App SHALL hiển thị số lượng kết quả tìm kiếm phía trên lưới sản phẩm.

---

### Yêu cầu 4: Chi tiết Sản phẩm với hiệu ứng 3D

**User Story:** Là một sinh viên, tôi muốn xem chi tiết sản phẩm với trải nghiệm trực quan, để đưa ra quyết định mua hàng chính xác.

#### Tiêu chí chấp nhận

1. THE App SHALL hiển thị trang chi tiết sản phẩm với ảnh sản phẩm, tên, giá, mô tả, danh mục và thông tin shop.
2. THE Query_Client SHALL gọi `GET /api/products/{id}` để lấy dữ liệu sản phẩm theo ID hoặc slug từ URL.
3. THE App SHALL hiển thị Scene_3D showcase sản phẩm (floating/rotating card effect) bên cạnh ảnh sản phẩm trên desktop.
4. THE App SHALL hiển thị gallery ảnh sản phẩm với khả năng chuyển ảnh và zoom.
5. WHEN người dùng đã đăng nhập với role customer, THE App SHALL hiển thị nút "Thêm vào giỏ hàng" và nút "Mua ngay".
6. WHEN người dùng nhấn "Thêm vào giỏ hàng", THE App SHALL gọi `POST /api/cart/items` và cập nhật Cart_Store, hiển thị thông báo thành công.
7. IF sản phẩm đã bị xóa hoặc không tồn tại, THEN THE App SHALL hiển thị trang 404 với gợi ý quay lại trang chủ.
8. THE App SHALL hiển thị link đến trang shop của seller bán sản phẩm đó.
9. THE App SHALL hiển thị các sản phẩm liên quan cùng danh mục phía cuối trang.

---

### Yêu cầu 5: Giỏ hàng và Đặt hàng

**User Story:** Là một customer, tôi muốn quản lý giỏ hàng và đặt hàng, để mua được sản phẩm mình cần.

#### Tiêu chí chấp nhận

1. THE App SHALL hiển thị trang giỏ hàng với danh sách sản phẩm, số lượng, giá từng item và tổng tiền.
2. THE Query_Client SHALL gọi `GET /api/cart` để đồng bộ giỏ hàng từ server khi người dùng đăng nhập.
3. WHEN người dùng thay đổi số lượng một item, THE App SHALL gọi `PUT /api/cart/items/{itemId}` và cập nhật tổng tiền ngay lập tức.
4. WHEN người dùng xóa một item khỏi giỏ hàng, THE App SHALL gọi `DELETE /api/cart/items/{itemId}` và cập nhật danh sách.
5. THE App SHALL hiển thị badge số lượng item trên icon giỏ hàng ở header, cập nhật realtime theo Cart_Store.
6. WHEN người dùng nhấn "Đặt hàng", THE App SHALL hiển thị form xác nhận địa chỉ giao hàng và gọi `POST /api/orders`.
7. WHEN đặt hàng thành công, THE App SHALL xóa giỏ hàng, hiển thị trang xác nhận đơn hàng với mã đơn hàng.
8. IF giỏ hàng rỗng, THEN THE App SHALL hiển thị thông báo giỏ hàng trống và nút "Tiếp tục mua sắm".
9. WHILE người dùng chưa đăng nhập, THE App SHALL chuyển hướng về trang đăng nhập khi truy cập trang giỏ hàng.

---

### Yêu cầu 6: Quản lý Đơn hàng

**User Story:** Là một customer, tôi muốn theo dõi và quản lý đơn hàng của mình, để biết trạng thái giao hàng.

#### Tiêu chí chấp nhận

1. THE App SHALL hiển thị trang lịch sử đơn hàng với danh sách đơn hàng, mỗi đơn gồm mã đơn, ngày đặt, tổng tiền và trạng thái.
2. THE Query_Client SHALL gọi `GET /api/orders` để lấy danh sách đơn hàng của người dùng hiện tại.
3. WHEN người dùng nhấn vào một đơn hàng, THE App SHALL hiển thị trang chi tiết đơn hàng với danh sách sản phẩm và thông tin giao hàng.
4. WHEN đơn hàng có trạng thái `pending`, THE App SHALL hiển thị nút "Hủy đơn hàng".
5. WHEN người dùng xác nhận hủy đơn, THE App SHALL gọi `PUT /api/orders/{id}/cancel` và cập nhật trạng thái hiển thị.
6. THE App SHALL hiển thị trạng thái đơn hàng bằng badge màu sắc: `pending` (vàng), `confirmed` (xanh lá), `cancelled` (đỏ).

---

### Yêu cầu 7: Quản lý Shop và Sản phẩm (Seller)

**User Story:** Là một seller, tôi muốn quản lý shop và sản phẩm của mình, để bán hàng hiệu quả trên nền tảng.

#### Tiêu chí chấp nhận

1. THE App SHALL cung cấp trang quản lý shop cho seller với thông tin shop (tên, mô tả, ảnh đại diện).
2. WHEN seller cập nhật thông tin shop, THE App SHALL gọi `PUT /api/shops/my` và hiển thị thông báo thành công.
3. THE App SHALL hiển thị danh sách sản phẩm của shop lấy từ `GET /api/shops/my` với các tùy chọn chỉnh sửa và xóa.
4. THE App SHALL cung cấp form đăng sản phẩm mới với các trường: tên, mô tả, giá, danh mục và upload ảnh (multipart).
5. WHEN seller gửi form đăng sản phẩm hợp lệ, THE App SHALL gọi `POST /api/products` với `multipart/form-data` và hiển thị sản phẩm mới trong danh sách.
6. WHEN seller nhấn chỉnh sửa sản phẩm, THE App SHALL hiển thị form điền sẵn dữ liệu hiện tại và gọi `PUT /api/products/{id}` khi lưu.
7. WHEN seller xác nhận xóa sản phẩm, THE App SHALL gọi `DELETE /api/products/{id}` và xóa sản phẩm khỏi danh sách hiển thị.
8. THE App SHALL hiển thị danh sách đơn hàng cần xử lý của shop, cho phép seller xác nhận đơn bằng `PUT /api/orders/{id}/confirm`.
9. WHILE người dùng không có role `seller`, THE Router SHALL ẩn các route quản lý shop và chuyển hướng về trang chủ nếu truy cập trực tiếp.

---

### Yêu cầu 8: Trang Shop công khai

**User Story:** Là một customer, tôi muốn xem trang shop của seller, để biết thêm về người bán và các sản phẩm họ đang bán.

#### Tiêu chí chấp nhận

1. THE App SHALL hiển thị trang shop công khai với thông tin shop (tên, mô tả, ảnh) lấy từ `GET /api/shops/{id}`.
2. THE App SHALL hiển thị danh sách sản phẩm đang bán của shop lấy từ `GET /api/shops/{id}/products`.
3. THE App SHALL hiển thị skeleton loading khi đang tải dữ liệu shop.
4. IF shop không tồn tại, THEN THE App SHALL hiển thị trang 404 với gợi ý quay lại trang chủ.

---

### Yêu cầu 9: Hồ sơ người dùng

**User Story:** Là một người dùng đã đăng nhập, tôi muốn xem và cập nhật thông tin cá nhân, để hồ sơ của tôi luôn chính xác.

#### Tiêu chí chấp nhận

1. THE App SHALL hiển thị trang hồ sơ cá nhân với thông tin: họ tên, email, số điện thoại và ảnh đại diện.
2. THE Query_Client SHALL gọi `GET /api/users/me` để lấy thông tin người dùng hiện tại.
3. WHEN người dùng cập nhật thông tin hồ sơ, THE App SHALL gọi `PUT /api/users/me` và cập nhật Auth_Store với dữ liệu mới.
4. THE App SHALL cung cấp form đổi mật khẩu với các trường: mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới.
5. WHEN người dùng gửi form đổi mật khẩu hợp lệ, THE App SHALL gọi `PUT /api/users/me/password` và hiển thị thông báo thành công.
6. IF mật khẩu hiện tại không đúng, THEN THE App SHALL hiển thị thông báo lỗi cụ thể từ API response.

---

### Yêu cầu 10: Chatbot AI tích hợp

**User Story:** Là một sinh viên, tôi muốn hỏi chatbot AI về sản phẩm và nền tảng, để được hỗ trợ mua sắm nhanh chóng.

#### Tiêu chí chấp nhận

1. THE App SHALL hiển thị Chat_Widget dạng nút nổi (floating button) ở góc dưới bên phải màn hình trên tất cả các trang.
2. WHEN người dùng nhấn vào Chat_Widget, THE App SHALL mở cửa sổ chat với lịch sử tin nhắn lấy từ `GET /api/chat/history`.
3. WHEN người dùng gửi tin nhắn, THE App SHALL gọi `POST /api/chat` và hiển thị phản hồi từ AI trong cửa sổ chat.
4. THE App SHALL hiển thị trạng thái "đang nhập..." (typing indicator) trong khi chờ phản hồi từ `POST /api/chat`.
5. WHEN người dùng nhấn "Xóa lịch sử", THE App SHALL gọi `DELETE /api/chat/history` và xóa toàn bộ tin nhắn trong cửa sổ chat.
6. IF `POST /api/chat` trả về lỗi, THEN THE App SHALL hiển thị thông báo lỗi trong cửa sổ chat và cho phép người dùng thử lại.
7. WHILE người dùng chưa đăng nhập, THE Chat_Widget SHALL hiển thị thông báo yêu cầu đăng nhập khi mở cửa sổ chat.
8. THE Chat_Widget SHALL hỗ trợ gửi tin nhắn bằng phím Enter và nút gửi.

---

### Yêu cầu 11: Bảng điều khiển Admin

**User Story:** Là một admin, tôi muốn quản lý người dùng, sản phẩm và đơn hàng trên nền tảng, để đảm bảo hoạt động của SmartCart.

#### Tiêu chí chấp nhận

1. THE App SHALL cung cấp route `/admin` chỉ truy cập được khi người dùng có role `admin`.
2. THE App SHALL hiển thị bảng danh sách người dùng lấy từ `GET /api/admin/users` với các cột: tên, email, role, trạng thái.
3. WHEN admin thay đổi trạng thái người dùng, THE App SHALL gọi `PUT /api/admin/users/{id}/status` và cập nhật bảng.
4. THE App SHALL hiển thị bảng danh sách sản phẩm lấy từ `GET /api/admin/products` với tùy chọn thay đổi trạng thái.
5. WHEN admin thay đổi trạng thái sản phẩm, THE App SHALL gọi `PUT /api/admin/products/{id}/status` và cập nhật bảng.
6. THE App SHALL hiển thị bảng danh sách đơn hàng lấy từ `GET /api/admin/orders` với thông tin tóm tắt.
7. WHILE người dùng không có role `admin`, THE Router SHALL chuyển hướng về trang 403 khi truy cập bất kỳ route `/admin` nào.

---

### Yêu cầu 12: Điều hướng và Layout chung

**User Story:** Là một người dùng, tôi muốn điều hướng dễ dàng trên SmartCart, để tìm được tính năng cần dùng nhanh chóng.

#### Tiêu chí chấp nhận

1. THE App SHALL hiển thị header cố định (sticky) với logo SmartCart, thanh tìm kiếm, icon giỏ hàng và menu người dùng.
2. WHILE người dùng chưa đăng nhập, THE App SHALL hiển thị nút "Đăng nhập" và "Đăng ký" trên header.
3. WHILE người dùng đã đăng nhập, THE App SHALL hiển thị ảnh đại diện và dropdown menu với các tùy chọn: Hồ sơ, Đơn hàng, Quản lý shop (nếu là seller), Đăng xuất.
4. THE App SHALL hiển thị footer với thông tin về SmartCart, liên kết hữu ích và thông tin liên hệ.
5. THE App SHALL hiển thị trang 404 tùy chỉnh khi người dùng truy cập route không tồn tại.
6. THE App SHALL hiển thị trang 403 tùy chỉnh khi người dùng không có quyền truy cập route.
7. THE App SHALL hỗ trợ chế độ mobile với hamburger menu thay thế navigation bar trên màn hình nhỏ hơn 768px.

---

### Yêu cầu 13: Hiệu suất và Trải nghiệm người dùng

**User Story:** Là một sinh viên dùng điện thoại, tôi muốn ứng dụng tải nhanh và mượt mà, để không bị gián đoạn khi mua sắm.

#### Tiêu chí chấp nhận

1. THE App SHALL lazy load các route không thuộc critical path (Admin, Shop Management) bằng `React.lazy` và `Suspense`.
2. THE Query_Client SHALL cache kết quả `GET /api/products` và `GET /api/categories` trong 5 phút để giảm số lần gọi API.
3. THE App SHALL hiển thị skeleton loading thay vì spinner cho tất cả các trang có dữ liệu từ API.
4. THE Scene_3D SHALL giảm chất lượng render tự động khi phát hiện thiết bị có hiệu năng thấp (dựa trên `devicePixelRatio` và frame rate).
5. THE App SHALL hiển thị toast notification cho các hành động thành công (thêm giỏ hàng, đặt hàng, cập nhật hồ sơ) trong 3 giây rồi tự động ẩn.
6. IF một API call thất bại do lỗi mạng, THEN THE App SHALL hiển thị thông báo lỗi thân thiện và nút "Thử lại".
7. THE App SHALL sử dụng `React.memo` và `useMemo` cho các component render danh sách sản phẩm lớn để tránh re-render không cần thiết.
