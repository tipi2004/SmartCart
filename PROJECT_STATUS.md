# SmartCart Project Status

## Cập nhật mới - 2026-06-03

### Hoàn thiện chatbot SmartCart
- DONE: Viết lại logic `ChatbotService` bằng tiếng Việt đúng dấu và sạch encoding.
- DONE: Bổ sung intent rõ ràng hơn: chào hỏi, tìm/gợi ý sản phẩm, kiểm tra đơn hàng, giỏ hàng/đặt hàng, thanh toán COD/chuyển khoản/QR, kênh bán hàng và fallback hỏi lại thông minh.
- DONE: Câu trả lời dùng dữ liệu thật từ DB, sắp xếp gợi ý theo độ khớp và giá, kèm nút xem sản phẩm/giỏ hàng/đơn hàng.
- DONE: Cải thiện UI chatbot: load lịch sử chat khi mở, tự cuộn xuống tin mới, chuẩn hóa role `model` cũ thành `assistant`.
- Kiểm tra: `mvn test` backend pass, `npx tsc --noEmit` frontend pass, backend `/api/products` trả `200`, frontend `/` trả `200`.

## Cập nhật mới - 2026-06-03

### Dọn lỗi UI/encoding
- DONE: Sửa lỗi chữ mojibake trong bộ lọc và sắp xếp sản phẩm:
  - `SmartCart-FE/components/products/ProductAdvancedFilters.tsx`
  - Các nhãn đã đúng dấu: `Lọc và sắp xếp`, `Mới nhất`, `Giá thấp đến cao`, `Giá cao đến thấp`, `Giá từ`, `Giá đến`, `Xóa lọc`.
- DONE: Sửa lỗi chữ mojibake trong popup đăng nhập/đăng ký/quên mật khẩu:
  - `SmartCart-FE/components/auth/LoginModal.tsx`
  - Các nhãn, placeholder và thông báo lỗi đã chuyển sang tiếng Việt có dấu.
- DONE: Sửa lỗi thông báo auth trong store:
  - `SmartCart-FE/store/authStore.ts`
  - Các thông báo như `Không nhận được token từ backend`, `Đăng nhập thất bại`, `Đăng ký thất bại` đã đúng encoding.
- Kiểm tra:
  - Quét lại các pattern mojibake trong `app/components/store/services/utils/types`: không còn lỗi ở các file UI đã xử lý.
  - `npx tsc --noEmit` frontend pass.
  - Frontend `/` trả `200`.

## Cập nhật mới - 2026-06-01

### Tối ưu hiệu năng trang mua sắm
- DONE: Tối ưu ảnh sản phẩm:
  - Thêm script `SmartCart-FE/scripts/optimizeProductImages.js`.
  - Tạo 30 ảnh WebP 600x600 từ ảnh PNG hiện có.
  - Tổng dung lượng ảnh WebP còn khoảng 0.49MB.
  - Cập nhật `tools/SeedDemoProducts.java` và seed lại DB để `imageUrl` trỏ sang `.webp`.
- DONE: Giảm số sản phẩm render ban đầu trong `ShoppingSection`:
  - Ban đầu chỉ render 16 sản phẩm.
  - Thêm nút `Xem thêm` để tải thêm từng nhóm 12 sản phẩm.
  - Reset số sản phẩm hiển thị khi tìm kiếm hoặc đổi danh mục.
- DONE: Giảm animation gây giật:
  - Bỏ animation nhún lặp vô hạn của mascot chatbot.
  - Mascot chỉ animate khi hiện/ẩn.
- DONE: Tối ưu `ExternalWidgetHider`:
  - MutationObserver chỉ hoạt động trong 5 giây sau khi load rồi tự ngắt.
  - Thêm `requestAnimationFrame` throttle để tránh quét DOM quá dày.
- Kiểm tra:
  - `GET /api/products` trả `imageUrl` `.webp`.
  - `GET /images/products/tra-sua-size-m.webp` trả `200`.
  - `npx tsc --noEmit` frontend pass.
  - Frontend `/` trả `200`.

### Chatbot SmartCart
- DONE: Nâng cấp chatbot từ trả lời text đơn thuần sang trợ lý mua sắm có dữ liệu thật:
  - Backend `/api/chat` ưu tiên tự xử lý các câu hỏi phổ biến bằng dữ liệu DB trước khi fallback sang Gemini.
  - Bot hỗ trợ tìm sản phẩm theo tên/danh mục/nhu cầu và giá, ví dụ `tìm đồ uống dưới 30k`.
  - Bot hỗ trợ kiểm tra đơn hàng gần nhất của user đang đăng nhập.
  - Bot hướng dẫn mở giỏ hàng, thanh toán và vào kênh bán hàng.
  - Nếu chưa cấu hình Gemini API key hoặc Gemini lỗi, bot vẫn có câu trả lời fallback thay vì báo lỗi thô.
- DONE: Thêm action button cho câu trả lời chatbot:
  - Backend trả thêm `actions` gồm `label`, `href`, `type`.
  - Frontend hiển thị các nút như `Tìm đồ ăn`, `Xem giỏ hàng`, `Kiểm tra đơn`, `Xem sản phẩm`.
  - Tin nhắn bot hỗ trợ xuống dòng để danh sách sản phẩm dễ đọc.
- Kiểm tra:
  - `mvn test` backend pass.
  - `npx tsc --noEmit` frontend pass.
  - Frontend `/` trả `200`.
  - Backend `/api/products` trả `200`.
- DONE: Tối ưu nhận diện intent chatbot:
  - Thêm phân loại rõ: chào hỏi, tìm sản phẩm, kiểm tra đơn, giỏ hàng/thanh toán, kênh bán hàng, hướng dẫn và fallback.
  - Câu mơ hồ như `alo`, `hi`, `xin chào` không còn tự tìm sản phẩm.
  - Chỉ tìm sản phẩm khi có ý định mua/tìm/gợi ý hoặc danh mục/giá rõ ràng.
  - Trả lời danh sách sản phẩm theo format đánh số, có giá, danh mục và nút xem sản phẩm.
  - Fallback hỏi lại thông minh khi chưa hiểu nhu cầu.
  - Đã restart backend để nhận logic mới.
  - Kiểm tra `mvn test`, `npx tsc --noEmit`, `/api/products`: OK.

### Dữ liệu sản phẩm demo
- DONE: Bổ sung thêm 30 sản phẩm demo thuộc nhiều nhóm hàng:
  - Đồ uống, đồ ăn, cửa hàng tiện lợi.
  - Quà tặng và phụ kiện, đồ cũ sinh viên.
  - Đồ dùng học tập, dịch vụ sinh viên, sách và giáo trình.
  - Vật dụng sinh hoạt, đồ dùng ký túc xá.
- DONE: Thêm ảnh local cho toàn bộ 30 sản phẩm demo trong `SmartCart-FE/public/images/products/`.
- DONE: Tạo script seed chạy lại được nhiều lần:
  - `tools/SeedDemoProducts.java`
  - Script tự tạo/cập nhật seller demo, shop active, category và sản phẩm approved.
  - Sản phẩm dùng `imageUrl` dạng `/images/products/<slug>.png`.
- DONE: Thay ảnh demo bằng bộ ảnh sản phẩm người dùng chuẩn bị ở Desktop:
  - Nguồn: `C:\Users\phong\Desktop\img-product`
  - Đích: `SmartCart-FE/public/images/products/`
  - Đã convert/resize 30 ảnh về đúng tên slug `.png` mà DB đang sử dụng.
  - Thêm script hỗ trợ convert: `SmartCart-FE/scripts/convertProductImages.js`.
- Kiểm tra:
  - Đã seed/cập nhật 30 sản phẩm vào PostgreSQL.
  - `GET http://localhost:8080/api/products` trả 56 sản phẩm.
  - `GET http://localhost:3000/images/products/tra-sua-size-m.png` trả `200`.
  - `npx tsc --noEmit` frontend pass.

## Cap nhat moi - 2026-05-30

### Bunny chatbot mascot
- DONE: Chinh hanh vi hinh con tho tren trang chu:
  - Khi o dau trang, mascot hero van giu vi tri cu trong `HeroSection`.
  - Khi cuon qua lop may vao khu mua sam, mascot chuyen thanh nut chatbot dang `fixed` ben phai man hinh va di theo viewport.
  - Bo mascot cu dang `absolute` o cuoi `ShoppingSection` de tranh chi xuat hien khi cuon xuong day section.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, frontend `/` tra `200`, backend `/api/products` tra `200`.
- DONE: Them khung chat khi bam vao mascot:
  - Copy anh khung chat vao `SmartCart-FE/public/images/chat-bubble-frame.webp`.
  - Tach nen caro thanh asset trong suot `SmartCart-FE/public/images/chat-bubble-frame-cutout.png`.
  - Them 4 khung chat rieng nen trong suot trong `SmartCart-FE/public/images/chat-frames/`.
  - Moi lan bam mo chatbot se chon ngau nhien mot khung chat.
  - Doi khung chat sang SVG ve tay truc tiep trong `ShoppingSection` de net sach hon va nen trong suot that.
  - Bam vao con tho se hien khung chat tren dau mascot, bam lai hoac nut dong se an khung.
  - Them mini chat co danh sach tin nhan, o nhap va nut gui trong bubble.
  - Them `SmartCart-FE/services/chatService.ts` goi API `POST /api/chat`.
  - Neu chua dang nhap ma gui tin nhan thi mo popup dang nhap.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, frontend `/` tra `200`, backend `/api/products` tra `200`.
- DONE: An widget noi ben phai co `Home/Manage`:
  - Them `SmartCart-FE/components/ui/ExternalWidgetHider.tsx`.
  - Gan vao `RootLayout` de tu an widget bi inject sau khi DOM render.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, frontend `/` tra `200`.

## Cap nhat moi - 2026-05-29

### Admin orders
- DONE: Tao khung admin dashboard rieng cho frontend:
  - Them `SmartCart-FE/components/admin/AdminShell.tsx` voi sidebar, topbar, search va cac muc quan ly.
  - Them route `/admin`, redirect sang `/admin/orders`.
- DONE: Tao trang quan ly don hang `/admin/orders`:
  - Goi API `GET /api/admin/orders` qua `adminService.getOrders()`.
  - Co thong ke tong don, cho thanh toan, cho xac nhan, da xac nhan.
  - Co tim kiem theo ma don/ten san pham va filter theo trang thai.
  - Co nut `Xac nhan da thanh toan` cho don `paymentStatus=processing`.
  - Co nut `Xac nhan don` cho don COD hoac don da thanh toan.
  - Goi API that `PUT /api/orders/{id}/confirm-payment` va `PUT /api/orders/{id}/confirm`.
- Kiem tra ky thuat: `npx tsc --noEmit` pass, `/admin` va `/admin/orders` tra `200`.
- DONE: Them lua chon `Trang quan ly` trong dropdown tai khoan tren header:
  - Chi hien khi JWT cua user co `role=admin`.
  - Bam vao se di toi `/admin`.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass.
- DONE: Hoan thien popup chi tiet don hang trong admin:
  - Nut `Xem chi tiet` tren `/admin/orders` goi `GET /api/admin/orders/{id}`.
  - Popup hien trang thai don, trang thai thanh toan, phuong thuc thanh toan, dia chi nhan hang, danh sach san pham, phi ship va tong thanh toan.
  - Popup co hanh dong `Xac nhan da thanh toan` va `Xac nhan don` theo dung dieu kien don.
  - Sau khi admin thao tac, danh sach va popup cap nhat lai order moi.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, `/admin/orders` tra `200`.
- DONE: Tao trang quan ly san pham admin `/admin/products`:
  - Goi API `GET /api/admin/products`.
  - Co thong ke tong san pham, dang hien thi, dang an.
  - Co tim kiem theo ten/danh muc/ma san pham va loc theo trang thai.
  - Co nut `An san pham` / `Hien san pham` goi API `PUT /api/admin/products/{id}/status`.
  - Lam sach text tieng Viet trong `AdminShell`.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, `/admin/products` va `/admin/orders` tra `200`.
- DONE: Tao trang quan ly nguoi dung admin `/admin/users`:
  - Goi API `GET /api/admin/users`.
  - Co thong ke tong nguoi dung, dang hoat dong, da khoa, admin.
  - Co tim kiem theo ten/email/so dien thoai/ma user.
  - Co loc theo trang thai va vai tro `admin`, `seller`, `customer`.
  - Co nut `Khoa` / `Mo khoa` goi API `PUT /api/admin/users/{id}/status`.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, `/admin/users` va `/admin/products` tra `200`.
- DONE: Tao trang quan ly thanh toan admin `/admin/payments`:
  - Loc rieng cac don co `paymentMethod=bank_transfer` hoac `qr`.
  - Co thong ke tong giao dich, cho xac nhan, da thanh toan, that bai/qua han.
  - Co tim kiem theo ma don/ten san pham va loc theo `paymentStatus`.
  - Hien noi dung chuyen khoan `SMARTCART-{ma don}` va han thanh toan neu co.
  - Co nut `Xac nhan thanh toan` goi API `PUT /api/orders/{id}/confirm-payment`.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, `/admin/payments` va `/admin/users` tra `200`.
- DONE: Tao dashboard tong quan admin `/admin`:
  - Thay redirect `/admin -> /admin/orders` bang trang dashboard that.
  - Goi song song `GET /api/admin/orders`, `GET /api/admin/products`, `GET /api/admin/users`.
  - Hien thong ke doanh thu, don hang, nguoi dung, san pham.
  - Hien tinh hinh don hang, don moi gan day, san pham noi bat va quick action xu ly thanh toan/don hang.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, `/admin`, `/admin/payments`, `/admin/orders` tra `200`.
- DONE: Bao ve khu vuc admin tren frontend:
  - Tach helper doc role tu JWT vao `SmartCart-FE/utils/auth.ts`.
  - `AdminShell` kiem tra token va `role=admin` truoc khi hien dashboard.
  - Chua dang nhap se mo popup dang nhap; khong phai admin se hien man `Can quyen quan tri`.
  - Them `ToastHost` vao admin shell de cac thong bao admin hien dung.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, `/admin`, `/admin/users`, `/admin/payments` tra `200`.
- DONE: Them nut quay ve cua hang tren admin topbar:
  - Nut `Ve cua hang` tro ve `/#shop` de admin quay lai trang mua sam nhanh.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass.
- DONE: Tao quan ly danh muc admin:
  - Backend them `CategoryRequest`.
  - Backend them CRUD admin:
    - `GET /api/admin/categories`
    - `POST /api/admin/categories`
    - `PUT /api/admin/categories/{id}`
    - `DELETE /api/admin/categories/{id}`
  - Backend tu tao slug neu bo trong, tranh trung slug, va chan xoa danh muc dang co san pham.
  - Frontend them service category trong `adminService`.
  - Frontend them route `/admin/categories`, co tim kiem, thong ke, form popup tao/sua va nut xoa.
  - Sidebar admin co muc `Danh muc`.
  - Da restart backend de nhan API moi.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, `mvn test` pass, `/admin/categories` tra `200`, `GET /api/admin/categories` bang token admin tra `200`.
- DONE: Tao kenh ban hang cho sinh vien/cua hang `/seller`:
  - Backend them `GET /api/shops/my/products` de seller xem tat ca san pham cua shop minh, ke ca san pham da an.
  - Backend `POST /api/products` nhan them `imageUrl` khi khong upload file anh.
  - Frontend them `sellerService`.
  - Frontend them trang `/seller` co thong tin shop, danh sach san pham, tim kiem, thong ke, dang san pham, sua san pham va an san pham.
  - Header dropdown sau dang nhap co them `Kenh ban hang`.
  - Shop duoc backend tu tao khi user dang san pham dau tien.
  - Da restart backend de nhan API moi.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, `mvn test` pass, `/seller` tra `200`, `/api/products` tra `200`.
- DONE: Them upload anh san pham cho kenh ban hang:
  - Form `/seller` dung nut `Chon anh` upload file tu may thay vi bat nhap link anh.
  - Co preview anh truoc khi luu.
  - `sellerService.createProduct` gui `imageFile` bang multipart.
  - Backend them endpoint `PUT /api/products/{id}/multipart` de seller sua san pham kem upload anh moi.
  - `sellerService.updateProduct` da doi sang multipart de sua anh.
  - Da restart backend de nhan endpoint moi.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, `mvn test` pass, `/seller` tra `200`, `/api/products` tra `200`.
- DONE: Them quan ly don hang cho seller:
  - Backend them query lay don hang co san pham thuoc shop seller.
  - Backend them `GET /api/shops/my/orders`.
  - `OrderResponse.fromSeller` chi tra cac item thuoc shop seller trong don.
  - Frontend `sellerService.getMyOrders()` goi API moi.
  - Trang `/seller` co tab `San pham` va `Don hang`.
  - Tab don hang co loc trang thai, hien san pham, dia chi nhan hang, tong tien lien quan va nut `Xac nhan thanh toan` / `Xac nhan don`.
  - Da restart backend de nhan API moi.
  - Kiem tra ky thuat: `npx tsc --noEmit` pass, `mvn test` pass, `/seller` tra `200`, `/api/products` tra `200`.

## Cap nhat moi - 2026-05-28

### Thanh toan QR va chuyen khoan ngan hang
- Da cau hinh thong tin nhan tien:
  - TPBank
  - STK `0523714536`
  - Chu tai khoan `HUYNH THANH PHONG`
- Popup xac nhan don hang hien thong tin chuyen khoan khi chon `Chuyen khoan ngan hang` hoac `Thanh toan QR`.
- Noi dung chuyen tien theo mau `SMARTCART-{ma don}`; truoc khi tao don hien tam `SMARTCART-MADON`, sau khi tao don hien ma don that.
- QR hien bang QR dong MoMo/deeplink tu so dien thoai, so tien va noi dung chuyen khoan.
- Don hang QR/chuyen khoan duoc tao voi `paymentStatus = processing` va `paymentExpiresAt = now + 15 phut`.
- Backend co scheduler tu huy don `pending + processing` khi qua han thanh toan, doi `status = cancelled`, `paymentStatus = failed`.
- Da them endpoint webhook khung `POST /api/orders/payment-webhook` de gateway xac nhan thanh toan thanh `paid`.
- Trang don hang hien `processing` la `Cho xac nhan thanh toan`.
- Kiem tra ky thuat: `mvn test` backend pass, `npx tsc --noEmit` frontend pass, `/cart` va `/orders` tra `200`.
- Da test API that: tao don `bank_transfer` co `paymentStatus=processing`, co `paymentExpiresAt`; goi webhook thanh cong doi sang `paid`.
- Da them API xac nhan thanh toan thu cong `PUT /api/orders/{id}/confirm-payment` cho admin/seller.
- Trang chi tiet don hang co nut `Xac nhan da thanh toan` khi don dang `paymentStatus=processing`.
- API xac nhan thu cong co kiem quyen: admin hoac seller chu shop cua san pham trong don moi duoc xac nhan.

### Loc va sap xep san pham nang cao
- Da them thanh `Loc va sap xep` cho khu san pham trang chu va trang `/shop`.
- Ho tro sap xep: moi nhat, gia thap den cao, gia cao den thap, ten A-Z.
- Ho tro loc theo khoang gia voi o `Gia tu` va `Gia den`.
- Co nut `Xoa loc` de reset sort/khoang gia ve mac dinh.
- Trang `/shop` luu danh sach goc trong product store roi ap dung filter/sort o frontend de khong can doi API backend.
- Kiem tra ky thuat: `npx tsc --noEmit` frontend pass, `/?q=sticker#shop` va `/shop?q=sticker` tra `200`.

### Tim kiem san pham tren header
- Da noi thanh search tren header vao danh sach san pham.
- Khi search o trang chu, web cap nhat URL `?q=...#shop`, cuon xuong khu cua hang va loc san pham ngay tai cho.
- Khi search o `/shop`, web cap nhat URL `/shop?q=...` va loc danh sach san pham.
- Khu san pham o trang chu va trang `/shop` deu doc keyword tu URL khi reload/direct link.
- Kiem tra ky thuat: `npx tsc --noEmit` frontend pass, `/?q=sticker#shop` va `/shop?q=sticker` tra `200`.

### Popup chi tiet san pham
- Da them popup chi tiet san pham dung chung cho `/shop` va khu san pham tren trang chu.
- Card san pham bay gio mo popup thay vi nhay sang trang chi tiet rieng.
- Popup co anh lon, thumbnail, thong tin shop, gia, giam gia hien thi, so luong, nut `Them vao gio hang`, nut `Mua ngay`, mo ta va quyen loi giao hang.
- Popup tu goi `GET /api/products/{id}` de lay thong tin moi nhat khi mo.
- Nut `Them vao gio hang` va `Mua ngay` van yeu cau dang nhap neu user chua dang nhap.
- Kiem tra ky thuat: `npx tsc --noEmit` frontend pass, `/shop` tra `200`.

### Ho so ca nhan va dia chi nhan hang
- Da bo sung `shippingAddress` cho user backend, API `GET/PUT /api/users/me` tra ve va cap nhat duoc dia chi nhan hang mac dinh.
- Da them o `Dia chi nhan hang mac dinh` vao popup ho so ca nhan.
- Popup xac nhan don hang tren `/cart` tu dong lay `fullName`, `phone`, `shippingAddress` tu ho so neu nguoi dung chua nhap.
- Da test API that voi tai khoan test: cap nhat profile va doc lai `shippingAddress` thanh cong.
- Kiem tra ky thuat: `npx tsc --noEmit` frontend pass, `mvn test` backend pass.

### Gio hang va dat hang theo san pham da chon
- Da bo gioi han phai chon toan bo gio hang moi duoc thanh toan.
- Frontend `/cart` da gui `selectedItemIds` khi tao don hang.
- Popup xac nhan don hang chi hien thi cac san pham dang duoc tick, tong tam tinh/phi van chuyen/tong thanh toan tinh theo phan da chon.
- Backend `POST /api/orders` da nhan `selectedItemIds`, chi tao don tu cac item duoc chon va chi xoa cac item do khoi gio hang.
- Da test API that: them 2 san pham vao gio, dat hang 1 san pham duoc chon, san pham con lai van o trong gio.
- Kiem tra ky thuat: `npx tsc --noEmit` frontend pass, `mvn test` backend pass.

File này dùng để theo dõi tiến độ hoàn thiện website SmartCart. Sau mỗi nhiệm vụ hoàn thành, cập nhật lại mục **Đã làm được** và đổi trạng thái trong **Plan còn lại**.

## Đã làm được

### Popup đăng nhập/đăng ký
- Đã đổi popup auth theo bản phác thảo mới:
  - Hiển thị một khung ở giữa màn hình.
  - Mặc định mở `Đăng nhập`; bấm `Đăng ký` mới chuyển sang form đăng ký trong cùng popup.
  - Thêm banner tiêu đề màu xanh, avatar thỏ tròn, mây trang trí và nền glassy.
  - Form đăng ký có: họ tên, email, mật khẩu, nhập lại mật khẩu.
  - Form đăng nhập có: email và mật khẩu.
  - Vẫn dùng API thật qua `useAuthStore.login` và `useAuthStore.register`.
- Đã kiểm tra `npm run lint`: không lỗi.
- Đã thêm đăng nhập bằng Google ở popup đăng nhập:
  - Nút `Dang nhap bang Google` trỏ tới OAuth endpoint backend `http://localhost:8080/oauth2/authorization/google`.
  - Sau khi backend redirect về frontend với `accessToken` và `refreshToken`, `Header` tự lưu token vào `localStorage`.
  - Đã xóa token khỏi URL bằng `window.history.replaceState` sau khi lưu.
  - Đã kiểm tra `npm run lint`: không lỗi.

### Chạy dự án
- Đã xác định cấu trúc project gồm:
  - `SmartCart-BE`: Spring Boot backend.
  - `SmartCart-FE`: Next.js frontend.
- Đã chạy backend ở `http://localhost:8080`.
- Đã chạy frontend ở `http://localhost:3000`.
- Đã kiểm tra backend endpoint `/api/products` trả `200 OK`.
- Đã kiểm tra frontend trang chủ trả `200 OK`.

### Giao diện trang chủ
- Đã thêm `Header` vào trang chủ `/`.
- Đã làm nền menu trong suốt.
- Đã sửa header ở trang chủ thành overlay để không tạo vùng trắng phía trên hero.
- Đã thay mascot thỏ vẽ bằng ảnh thật.
- Đã tách nền ảnh thỏ:
  - Gốc: `SmartCart-FE/public/images/image.png`
  - Tách nền: `SmartCart-FE/public/images/bunny-cart-transparent.png`
  - Crop sát nhân vật: `SmartCart-FE/public/images/bunny-cart-cutout.png`
- Đã tăng kích thước mascot hero và chỉnh vị trí sang trái.
- Đã xóa chấm đen/blink cũ còn sót trên mascot.
- Đã thay bệ dưới thỏ bằng các ảnh mây thật.

### Asset mây
- Đã thêm `cloud.png`.
- Đã cắt `cloud.png` thành 12 ảnh mây riêng trong:
  - `SmartCart-FE/public/images/clouds/cloud-01.png`
  - ...
  - `SmartCart-FE/public/images/clouds/cloud-12.png`
- Đã dùng ảnh mây đã cắt cho:
  - Mây nền hero.
  - Mây dưới mascot.
  - Đoạn chuyển cảnh giữa hero và shop preview.
- Đã tăng mật độ mây ở đoạn chuyển cảnh bằng nhiều ảnh mây chồng lên nhau.
- Đã chỉnh nền đoạn chuyển cảnh từ `from-sky-100` sang `from-white` để không bị ranh màu rõ giữa hai section.

### Asset nhà và cây
- Đã thêm `house.png` và `trees.png`.
- Đã tách nền nhà thành:
  - `SmartCart-FE/public/images/house-transparent.png`
- Đã tách `trees.png` thành từng cây riêng:
  - `SmartCart-FE/public/images/trees/tree-01.png`
  - ...
  - `SmartCart-FE/public/images/trees/tree-06.png`
- Đã thay nhà/cây vẽ bằng div trong `ShoppingSection` bằng asset thật.
- Đã rải nhiều cây riêng quanh phần shop preview.

### Trang hiện có ở frontend
- `/`: Trang chủ.
- `/shop`: Trang cửa hàng.
- `/product/[id]`: Chi tiết sản phẩm.
- `/cart`: Giỏ hàng.
- `/checkout`: Thanh toán.
- `/login`: Đăng nhập.
- `/register`: Đăng ký.

### API backend hiện có
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - OTP, verify email/SMS, forgot password, Google OAuth success.
- Products:
  - `GET /api/products`
  - `GET /api/products/{id}`
  - `POST /api/products`
  - `PUT /api/products/{id}`
  - `DELETE /api/products/{id}`
- Categories:
  - `GET /api/categories`
  - `GET /api/categories/{id}`
  - `GET /api/categories/{id}/products`
- Cart:
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PUT /api/cart/items/{itemId}`
  - `DELETE /api/cart/items/{itemId}`
  - `DELETE /api/cart`
- Orders:
  - `POST /api/orders`
  - `GET /api/orders`
  - `GET /api/orders/{id}`
  - `PUT /api/orders/{id}/cancel`
  - `PUT /api/orders/{id}/confirm`
- Users:
  - `GET /api/users/me`
  - `PUT /api/users/me`
  - `PUT /api/users/me/password`
- Shops:
  - `GET /api/shops/my`
  - `PUT /api/shops/my`
  - `GET /api/shops/{id}`
  - `GET /api/shops/{id}/products`
- Admin:
  - Users/products/orders management endpoints.
- Chat:
  - `POST /api/chat`
  - `GET /api/chat/history`
  - `DELETE /api/chat/history`
- Upload:
  - `POST /api/upload`

### API đã gắn vào frontend
- Đăng nhập: `POST /api/auth/login`.
- Đăng ký: `POST /api/auth/register`.
- Danh sách sản phẩm: `GET /api/products`.
- Tìm kiếm/filter sản phẩm: `GET /api/products?keyword=&categoryId=`.
- Chi tiết sản phẩm: `GET /api/products/{id}`.
- Danh mục: `GET /api/categories`.
- Giỏ hàng: `GET /api/cart`.
- Thêm vào giỏ: `POST /api/cart/items`.
- Cập nhật số lượng: `PUT /api/cart/items/{itemId}`.
- Xóa item khỏi giỏ: `DELETE /api/cart/items/{itemId}`.
- Tạo đơn hàng: `POST /api/orders`.
- Preview `Bunny Shop` ở trang chủ: `GET /api/products` và `GET /api/categories`.
- Lịch sử đơn hàng service: `GET /api/orders`.

### Cập nhật gần nhất
- Đã thêm phí vận chuyển và phương thức thanh toán cho order:
  - Backend `Order` có `shippingFee`, `paymentMethod`, `paymentStatus`.
  - `CreateOrderRequest` nhận `shippingFee`, `paymentMethod`, `shippingAddress`, `note`.
  - `OrderResponse` trả `shippingFee`, `paymentMethod`, `paymentStatus`.
  - `OrderService` tính `totalAmount = subtotal + shippingFee`.
  - Checkout FE hiển thị tạm tính, phí vận chuyển 15.000đ, tổng thanh toán và chọn `COD`, `Chuyển khoản`, `QR`.
  - Đã cập nhật DB local cho các cột `shipping_fee`, `payment_method`, `payment_status`.
  - Đã restart backend.
- Đã kiểm tra `npm run lint`, `mvn test`, backend `/api/products`, frontend `/checkout`: đều OK.
- Đã đổi `Ho so ca nhan` trong account menu sang popup thay vì điều hướng trang:
  - Thêm `SmartCart-FE/store/profileModalStore.ts`.
  - Thêm `SmartCart-FE/components/profile/ProfileModal.tsx`.
  - Header mở profile modal ngay trên màn hình hiện tại khi bấm `Ho so ca nhan`.
  - Vẫn giữ `/profile` làm route phụ nếu truy cập trực tiếp, nhưng menu không nhảy trang nữa.
- Đã kiểm tra `npm run lint` và frontend `/`: OK.
- Đã tạo trang `/profile` để sửa lỗi 404 khi bấm `Ho so ca nhan`:
  - Gọi `GET /api/users/me` để lấy hồ sơ.
  - Gọi `PUT /api/users/me` để cập nhật `fullName` và `phone`.
  - Gọi `PUT /api/users/me/password` để đổi mật khẩu.
  - Email hiển thị dạng read-only vì backend hiện không cho sửa email.
  - Nếu chưa đăng nhập, trang mở popup login và hiển thị yêu cầu đăng nhập.
- Đã kiểm tra `npm run lint` và `http://localhost:3000/profile`: OK.
- Đã thêm `shippingAddress` cho checkout/order:
  - Backend `CreateOrderRequest` nhận `shippingAddress` bắt buộc và `note` tùy chọn.
  - Entity/response `Order` có thêm `shippingAddress`.
  - FE checkout có ô `Dia chi giao hang` và `Ghi chu`; đặt hàng sẽ gửi `shippingAddress` lên `POST /api/orders`.
  - Đã cập nhật DB local và SQL init để có cột `orders.shipping_address`.
  - Đã restart backend để nhận code mới.
- Đã kiểm tra `npm run lint`, `mvn test`, backend `/api/products`, frontend `/checkout`: đều OK.
- Đã làm menu tài khoản sau đăng nhập ở `Header`:
  - Thay nút logout trần bằng nút avatar/user có dropdown.
  - Dropdown có `Ho so ca nhan`, `Don hang cua toi`, `Dang xuat`.
  - Click ngoài menu sẽ tự đóng, bấm đăng xuất sẽ logout ngay.
- Đã kiểm tra `npm run lint`: không lỗi.
- Đã đổi header trang chủ sang `fixed` để thanh menu luôn đi theo màn hình khi scroll.
- Đã kiểm tra `npm run lint`: không lỗi.
- Đã thêm toast thông báo dùng chung cho thao tác thêm giỏ:
  - Thêm `SmartCart-FE/store/toastStore.ts` và `SmartCart-FE/components/ui/ToastHost.tsx`.
  - Gắn `ToastHost` vào `Header` để hiện thông báo nổi giữa màn hình trên toàn app.
  - Khi thông báo tự tắt hoặc bấm đóng, toast sẽ animate bay về icon giỏ hàng trên header.
  - Khi thêm giỏ thành công ở shop/product card/product detail: hiện `Da them san pham vao gio hang.`
  - Khi thêm giỏ thất bại: hiện lỗi dạng toast thay vì im lặng.
- Đã kiểm tra `npm run lint`: không lỗi.
- Đã sửa schema DB khiến thêm giỏ hàng không lưu:
  - Nguyên nhân: bảng `cart_items` trong database cũ yêu cầu `variant_id NOT NULL` và FK `cart_id` trỏ nhầm sang bảng `cart`, trong khi backend hiện dùng `products` trực tiếp và bảng `carts`.
  - Đã alter DB local: `variant_id` cho phép null, FK `cart_id` trỏ sang `public.carts(id)`, unique theo `(cart_id, product_id)`.
  - Đã cập nhật `SmartCart-BE/src/main/resources/init.sql` và `SmartCart-BE/database/init.sql` để DB mới không bị lại.
  - Đã test API thêm `Gau bong mini tang ban` vào giỏ: thành công, quantity tăng từ 1 lên 2 khi thêm lần nữa.
- Đã kiểm tra `npm run lint` và `mvn test`: đều OK.
- Đã sửa lỗi thêm sản phẩm vào giỏ:
  - FE bọc lỗi `addToCart` bằng `try/catch` để không còn bật overlay đỏ `1 Issue` của Next khi API lỗi.
  - Section shop hiển thị thông báo `Da them san pham vao gio hang.` khi thêm thành công hoặc lỗi rõ ràng nếu thất bại.
  - Product card/detail cũng không còn throw lỗi chưa bắt khi add cart.
  - BE `CartService.addItem()` đã cập nhật lại `cart.items` sau khi thêm item mới để response trả về giỏ hàng mới nhất.
- Đã restart backend để nhận sửa `CartService`.
- Đã kiểm tra `npm run lint`, `mvn test`, frontend `/`, backend `/api/products`: đều OK.
- Đã nối chức năng quên mật khẩu trong popup đăng nhập:
  - Bấm `Quen mat khau?` chuyển sang form reset trong cùng popup.
  - Gọi `POST /api/auth/forgot-password` với email/số điện thoại, mật khẩu mới và xác nhận mật khẩu.
  - Nếu reset bằng email: hiển thị thông báo kiểm tra email/link xác nhận.
  - Nếu reset bằng số điện thoại: hiển thị ô nhập OTP và gọi `POST /api/auth/verify-reset-sms`.
  - Thêm API frontend trong `SmartCart-FE/services/authService.ts`.
- Đã kiểm tra `npm run lint`: không lỗi.
- Đã kiểm tra frontend `/` và backend `/api/products`: đều trả `200 OK`.
- Đã thêm chặn đăng nhập cho các thao tác cần tài khoản:
  - Chưa đăng nhập bấm giỏ hàng trên header/section shop/hero sẽ mở popup đăng nhập.
  - Chưa đăng nhập bấm thêm sản phẩm vào giỏ ở shop, product card, product detail sẽ mở popup đăng nhập.
  - Trang `/cart` và `/checkout` không gọi API riêng tư khi chưa đăng nhập; hiển thị yêu cầu đăng nhập và mở popup login.
  - Dùng chung `SmartCart-FE/store/authModalStore.ts` để mọi nơi mở cùng một popup auth.
- Đã kiểm tra `npm run lint`: không lỗi.
- Đã kiểm tra `http://localhost:3000`, `/cart`, `/checkout`: đều trả `200 OK`.
- Đã bỏ nút wishlist/icon trái tim khỏi `Header` vì backend hiện chưa có API wishlist/yêu thích.
- Đã đổi nút login trên `Header` từ link `/login` sang popup glassy:
  - Thêm `SmartCart-FE/components/auth/LoginModal.tsx`.
  - Popup dùng API đăng nhập thật qua `useAuthStore.login`.
  - Có nền blur/glass, nút đóng, đóng bằng phím `Escape`, và đóng sau khi đăng nhập thành công.
- Đã chuyển phần mua sắm chính về section `Bunny Shop` trên trang chủ:
  - Section có anchor `#shop`.
  - Search sản phẩm chạy tại chỗ bằng `GET /api/products?keyword=`.
  - Chọn danh mục chạy tại chỗ bằng `GET /api/products?categoryId=`.
  - Không chuyển sang `/shop` khi chọn danh mục.
  - Nút giỏ hàng trên card thêm sản phẩm trực tiếp bằng `POST /api/cart/items`.
- Đã đổi link điều hướng:
  - `Header` nút `Cua hang` trỏ về `/#shop`.
  - Hero nút `Mua sam ngay` trỏ về `#shop`.
- Đã sửa `SmartCart-FE/services/orderService.ts`: bỏ endpoint sai `/orders/my-orders`, dùng đúng `GET /api/orders`.
- Đã thay dữ liệu mock trong `SmartCart-FE/components/sections/ShoppingSection.tsx` bằng dữ liệu thật từ `productService.getProducts()` và `productService.getCategories()`.
- Đã kiểm tra:
  - `npm run lint`: không lỗi.
  - `http://localhost:3000`: `200 OK`.
  - `http://localhost:8080/api/products`: `200 OK`.
  - `http://localhost:8080/api/categories`: `200 OK`.

### Đang mock/demo
- `CategoryPills` có fallback danh mục tĩnh nếu API danh mục lỗi hoặc rỗng.

## Plan còn lại

| Status | Task | Ghi chú |
| --- | --- | --- |
| TODO | Chuẩn hóa text tiếng Việt | Một số file vẫn còn chữ không dấu hoặc lỗi encoding ở UI demo. |
| DONE | Gắn API thật cho section `Bunny Shop` trên trang chủ | Đã thay mảng tĩnh bằng `GET /api/products` và `GET /api/categories` trong `ShoppingSection.tsx`. |
| TODO | Hoàn thiện trạng thái đăng nhập | Header cần hiển thị user/logout rõ hơn, xử lý token hết hạn/refresh token. |
| TODO | Thêm trang hồ sơ cá nhân | Dùng `GET /api/users/me`, `PUT /api/users/me`, `PUT /api/users/me/password`. |
| TODO | Thêm trang lịch sử đơn hàng | Dùng `GET /api/orders`, chi tiết dùng `GET /api/orders/{id}`. |
| DONE | Sửa service đơn hàng | `orderService.getMyOrders()` đã dùng đúng `GET /api/orders`. |
| TODO | Thêm UI hủy/xác nhận đơn hàng | Dùng `PUT /api/orders/{id}/cancel` và `PUT /api/orders/{id}/confirm`. |
| TODO | Thêm luồng quên mật khẩu/OTP | Backend đã có API, frontend chưa có page/form. |
| TODO | Thêm trang shop/seller | Dùng `/api/shops/my`, update shop, danh sách sản phẩm shop. |
| TODO | Thêm form đăng bán/cập nhật sản phẩm | Dùng `POST /api/products`, `PUT /api/products/{id}`, upload ảnh multipart. |
| TODO | Thêm trang admin | Quản lý users/products/orders bằng `/api/admin/*`. |
| TODO | Thêm chatbot UI | Dùng `POST /api/chat`, `GET /api/chat/history`, `DELETE /api/chat/history`. |
| TODO | Hoàn thiện upload ảnh | Dùng `POST /api/upload` hoặc upload trong `POST /api/products`. |
| TODO | Bảo vệ route cần đăng nhập | `/cart`, `/checkout`, profile, orders, seller/admin cần redirect nếu chưa login. |
| TODO | Tối ưu responsive mobile | Kiểm tra hero, mascot, cloud transition, shop cards ở mobile. |
| TODO | Tối ưu performance asset | Nén/crop ảnh PNG lớn, cân nhắc WebP cho mây/thỏ/nhà/cây. |
| TODO | Thêm loading/error states đầy đủ | Đặc biệt product detail, cart, checkout, login/register. |
| TODO | Kiểm thử build production | Chạy `npm run build` frontend và test backend Maven. |
| TODO | Kiểm thử end-to-end workflow | Register/login -> browse products -> add cart -> checkout -> orders. |

## Quy ước cập nhật status

Status dùng trong bảng plan:
- `TODO`: Chưa làm.
- `IN_PROGRESS`: Đang làm.
- `DONE`: Đã hoàn thành và đã kiểm tra.
- `BLOCKED`: Bị chặn, cần dữ liệu/quyết định thêm.

Khi hoàn thành một nhiệm vụ:
1. Đổi status task từ `TODO` hoặc `IN_PROGRESS` sang `DONE`.
2. Thêm mô tả ngắn vào phần **Đã làm được**.
3. Ghi rõ file/API/page đã chỉnh nếu có.
4. Ghi kết quả kiểm tra, ví dụ `npm run lint`, `npm run build`, HTTP `200 OK`, hoặc lý do chưa kiểm tra được.
## Update 2026-05-28

- DONE: Chỉnh UI xác nhận đơn hàng `/checkout` theo mockup:
  - Màn checkout dạng modal ở giữa, nền phía sau phủ tối và blur.
  - Có khối địa chỉ nhận hàng, phương thức thanh toán, chi tiết đơn, tổng thanh toán và nút xác nhận gradient.
  - Gửi `shippingAddress`, `shippingFee`, `paymentMethod`, `note` vào `POST /api/orders`.
  - Kiểm tra API liên quan: `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{id}`, `PUT /api/orders/{id}/cancel`, `PUT /api/orders/{id}/confirm`.
  - Sửa schema DB/init để `orders.shop_id` không bắt buộc và các cột legacy `subtotal`, `unit_price`, `total_price` có default, phù hợp backend order hiện tại.
  - Test tạo đơn qua API thành công.
  - Kiểm tra `npx tsc --noEmit`, `mvn test`, `/checkout`: OK.
- DONE: Sửa thao tác chọn/xóa ở giỏ hàng:
  - Tick từng sản phẩm và `Chọn tất cả` đã bấm được, có state chọn/bỏ chọn ở FE.
  - Tổng kết đơn hàng tính theo sản phẩm đang chọn.
  - `Xóa đã chọn` gọi API xóa từng item.
  - Sửa backend `CartService.removeItem()` để sau khi `DELETE /api/cart/items/{itemId}` response không còn trả lại item vừa xóa.
  - Đã restart backend và test API xóa item: OK.
  - Kiểm tra `npx tsc --noEmit`, `mvn test`, `/cart`, `/api/products`: OK.
- DONE: Chuyen chu hien thi frontend sang tieng Viet co dau:
  - Cap nhat header, auth popup, profile popup/page, cart, orders, checkout, shop, product, hero va toast/error message chinh.
  - Tu cac man hinh UI tiep theo se dung tieng Viet co dau mac dinh.
  - Kiem tra `npx tsc --noEmit`, `/`, `/cart`, `/orders`: OK.
- DONE: Chinh lai giao dien `/cart` theo mockup gio hang:
  - Header overlay, nen xanh nhat dong bo trang don hang.
  - Danh sach gio hang doi sang card glassy, co checkbox, anh san pham, tang/giam so luong, tong tien va nut xoa mau hong.
  - Them thanh tien do mien phi van chuyen va cot tong ket ben phai voi nut thanh toan gradient.
  - Them khoi quyen loi SmartCart.
  - Kiem tra `npx tsc --noEmit` va `http://localhost:3000/cart`: OK.
- DONE: Chinh lai giao dien `/orders` gan hon mockup don hang:
  - Nen xanh nhat theo thiet ke.
  - Card hero/stat/search/filter doi sang glassy xanh-trang.
  - Nut filter active doi sang gradient xanh-tim.
  - Modal chi tiet don hang doi palette theo trang don hang.
  - Kiem tra `npx tsc --noEmit` va `http://localhost:3000/orders`: OK.
# Update 2026-05-28 - Cart checkout popup

- DONE: Nang cap popup chi tiet don hang o `/orders`:
  - Thay lai file `/orders` bang ban UTF-8 sach, tranh loi font tieng Viet.
  - Popup chi tiet co timeline trang thai, thong tin seller, san pham, tong thanh toan, dia chi nhan hang va nut hanh dong.
  - Nut `Huy don hang` van goi API `PUT /api/orders/{id}/cancel` khi don o trang thai `pending`.
  - Kiem tra `npx tsc --noEmit` va `/orders`: OK.
- DONE: Hoan thien flow sau khi dat hang:
  - Sau khi `POST /api/orders` thanh cong, popup xac nhan chuyen sang man `Dat hang thanh cong`.
  - Hien ma don hang rut gon neu API tra ve `order.id`.
  - Them nut `Xem don hang` de sang `/orders` va `Tiep tuc mua sam` de ve shop tren trang chu.
  - Kiem tra `npx tsc --noEmit`, `/cart`, `/orders`: OK.
- DONE: Doi xac nhan don hang sang popup tren trang gio hang:
  - Bam `Thanh toan` o `/cart` mo popup xac nhan don hang theo mockup, khong can nhay sang trang `/checkout`.
  - Popup co dia chi nhan hang, phuong thuc thanh toan, chi tiet don, phi van chuyen, tong thanh toan va nut xac nhan.
  - Nut xac nhan goi API that `POST /api/orders`.
  - Da kiem tra API hien tai tao don tu toan bo gio hang, chua ho tro `selectedItemIds`; tam thoi yeu cau chon tat ca truoc khi mo popup de tranh tao sai don.
  - Kiem tra `npx tsc --noEmit` va `/cart`: OK.

## Update 2026-05-29 - Duyet san pham seller

- DONE: Them luong duyet san pham cho kenh ban hang:
  - Backend `Product` co `approvalStatus`: `pending`, `approved`, `rejected`.
  - San pham seller tao moi hoac chinh sua se ve trang thai `pending`.
  - API public `GET /api/products`, `GET /api/products/{id}`, tim kiem san pham, danh muc va chatbot chi lay san pham `approved` dang hien thi.
  - API public `GET /api/shops/{id}/products` cung chi hien san pham `approved`, con seller van xem duoc toan bo san pham cua shop minh.
  - Admin co endpoint `PUT /api/admin/products/{id}/approval?approvalStatus=...` de duyet, tu choi hoac dua ve cho duyet.
  - Trang `/admin/products` da doi thanh man duyet san pham, co filter `Tat ca`, `Cho duyet`, `Da duyet`, `Tu choi`, `Dang an` va nut `Duyet`/`Tu choi`.
  - Trang `/seller` hien thong ke `Cho duyet` va badge trang thai duyet tren tung san pham.
  - SQL init da them cot `products.approval_status` default `approved` cho du lieu seed.
  - Da restart backend de nhan API moi.
  - Kiem tra ky thuat: `mvn test` pass, `npx tsc --noEmit` pass, `/admin/products` tra `200`, `/seller` tra `200`, `GET /api/admin/products` bang token admin tra du lieu.
- DONE: Them ly do tu choi san pham:
  - Backend them cot `products.rejection_reason` va field `rejectionReason` trong `ProductResponse`.
  - API admin `PUT /api/admin/products/{id}/approval` nhan them `rejectionReason` khi `approvalStatus=rejected`.
  - Khi admin duyet lai hoac dua ve cho duyet, backend tu xoa ly do tu choi cu.
  - Trang `/admin/products` mo popup nhap ly do khi bam `Tu choi`.
  - Trang `/seller` hien `Ly do tu choi` tren card san pham bi tu choi.
  - Da cap nhat SQL init cho DB moi.
  - Da restart backend de nhan cot moi.
  - Kiem tra ky thuat: `mvn test` pass, `npx tsc --noEmit` pass, `/admin/products` tra `200`, `/seller` tra `200`, `GET /api/admin/products` co field `rejectionReason`.
- DONE: Them luong duyet shop/seller:
  - Backend shop moi tu tao khi seller dang san pham dau tien se co `status=pending`, `isVerified=false`.
  - Backend them API admin:
    - `GET /api/admin/shops`
    - `PUT /api/admin/shops/{id}/status?status=pending|active|suspended`
  - Khi admin chuyen shop sang `active`, backend set `isVerified=true`; khi `pending` hoac `suspended` thi `isVerified=false`.
  - API public san pham chi hien san pham da duyet cua shop `active`.
  - Frontend them menu admin `Shop/Seller` va trang `/admin/shops` de duyet, khoa, hoac dua shop ve cho duyet.
  - Trang `/seller` hien badge trang thai shop va thong bao neu shop dang cho duyet/bi khoa.
  - Da restart backend de nhan API moi.
  - Kiem tra ky thuat: `mvn test` pass, `npx tsc --noEmit` pass, `/admin/shops` tra `200`, `/seller` tra `200`, `GET /api/admin/shops` bang token admin tra du lieu.
- DONE: Bo sung thong tin chu shop cho admin:
  - `ShopResponse` tra them `ownerName`, `ownerEmail`, `ownerPhone`.
  - `GET /api/admin/shops` lay thong tin chu shop tu `ownerId`.
  - Trang `/admin/shops` hien ten chu shop, email, so dien thoai va cho tim kiem theo cac thong tin nay.
  - Da restart backend.
  - Kiem tra ky thuat: `mvn test` pass, `npx tsc --noEmit` pass, `/admin/shops` tra `200`, `GET /api/admin/shops` bang token admin tra `ownerName` va `ownerEmail`.
- DONE: Chan seller dang/sua san pham khi shop bi khoa:
  - Backend `ProductService.createProduct` va `ProductService.updateProduct` chan shop co `status=suspended`.
  - Frontend `/seller` disable nut `Dang san pham`, `Dang san pham dau tien` va `Sua` khi shop bi khoa.
  - Khi seller co tinh thao tac, frontend hien toast bao shop dang bi khoa.
  - Seller van co the an san pham cu de don shop.
  - Da restart backend.
  - Kiem tra ky thuat: `mvn test` pass, `npx tsc --noEmit` pass, `/seller` va `/admin/shops` tra `200`.
