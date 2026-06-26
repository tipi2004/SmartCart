package com.smartcart.config;

import com.smartcart.entity.Category;
import com.smartcart.entity.Product;
import com.smartcart.entity.Shop;
import com.smartcart.entity.User;
import com.smartcart.repository.CategoryRepository;
import com.smartcart.repository.ProductRepository;
import com.smartcart.repository.ShopRepository;
import com.smartcart.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class DemoDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public DemoDataSeeder(UserRepository userRepository,
                          ShopRepository shopRepository,
                          CategoryRepository categoryRepository,
                          ProductRepository productRepository) {
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (productRepository.count() > 0) {
            return;
        }

        User seller = userRepository.findByEmail("seller@smartcart.local")
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Sinh viên SmartCart")
                        .email("seller@smartcart.local")
                        .phone("0900000001")
                        .shippingAddress("Ký túc xá Đại học Nha Trang")
                        .passwordHash(new BCryptPasswordEncoder().encode("123456"))
                        .role("seller")
                        .isActive(true)
                        .build()));

        Shop shop = shopRepository.findByOwnerId(seller.getId())
                .orElseGet(() -> shopRepository.save(Shop.builder()
                        .ownerId(seller.getId())
                        .name("Bunny Shop")
                        .slug("bunny-shop")
                        .status("active")
                        .isVerified(true)
                        .build()));

        Map<String, Category> categories = new LinkedHashMap<>();
        categories.put("do-an", category("Đồ ăn", "do-an", 1));
        categories.put("do-uong", category("Đồ uống", "do-uong", 2));
        categories.put("do-dung-hoc-tap", category("Đồ dùng học tập", "do-dung-hoc-tap", 3));
        categories.put("sach-va-giao-trinh", category("Sách và giáo trình", "sach-va-giao-trinh", 4));
        categories.put("do-cu-sinh-vien", category("Đồ cũ sinh viên", "do-cu-sinh-vien", 5));
        categories.put("qua-tang-va-phu-kien", category("Quà tặng và phụ kiện", "qua-tang-va-phu-kien", 6));
        categories.put("vat-dung-sinh-hoat", category("Vật dụng sinh hoạt", "vat-dung-sinh-hoat", 7));
        categories.put("cua-hang-tien-loi", category("Cửa hàng tiện lợi", "cua-hang-tien-loi", 8));

        categories.values().forEach(categoryRepository::save);

        addProduct(shop, categories.get("vat-dung-sinh-hoat"), "Móc treo quần áo 10 cái", "moc-treo-quan-ao-10-cai", 25000, 40, "/images/products/moc-treo-quan-ao.webp", "Bộ móc treo gọn nhẹ, phù hợp phòng trọ và ký túc xá.");
        addProduct(shop, categories.get("qua-tang-va-phu-kien"), "Gấu bông mini tặng bạn", "gau-bong-mini-tang-ban", 75000, 25, "/images/products/gau-bong-mini.webp", "Gấu bông nhỏ xinh, thích hợp làm quà tặng.");
        addProduct(shop, categories.get("qua-tang-va-phu-kien"), "Móc khóa SmartCart cute", "moc-khoa-smartcart-cute", 18000, 80, "/images/products/moc-khoa-smartcart.webp", "Móc khóa phong cách SmartCart Bunny.");
        addProduct(shop, categories.get("cua-hang-tien-loi"), "Mì ly ăn liền", "mi-ly-an-lien", 12000, 100, "/images/products/mi-ly-an-lien.webp", "Mì ly tiện lợi cho bữa nhanh.");
        addProduct(shop, categories.get("do-dung-hoc-tap"), "Bàn nhựa gấp gọn Duy Tân", "ban-nhua-gap-gon-duy-tan", 65000, 12, "/images/products/ban-nhua-gap-gon.webp", "Bàn học gấp gọn, dùng để học hoặc ăn cơm trong phòng.");
        addProduct(shop, categories.get("vat-dung-sinh-hoat"), "Quạt bàn Senko mini", "quat-ban-senko-mini", 85000, 10, "/images/products/quat-ban-senko-mini.webp", "Quạt bàn nhỏ gọn, phù hợp góc học tập.");
        addProduct(shop, categories.get("do-uong"), "Trà sữa size M", "tra-sua-size-m", 25000, 60, "/images/products/tra-sua-size-m.webp", "Trà sữa size M, vị ngọt dễ uống.");
        addProduct(shop, categories.get("do-an"), "Bánh mì thịt trứng buổi sáng", "banh-mi-thit-trung-buoi-sang", 18000, 35, "/images/products/banh-mi-thit.webp", "Bánh mì thịt trứng dùng cho bữa sáng.");
        addProduct(shop, categories.get("do-an"), "Cơm cuộn rong biển sinh viên", "com-cuon-rong-bien-sinh-vien", 25000, 30, "/images/products/com-cuon-rong-bien.webp", "Cơm cuộn rong biển tiện lợi.");
        addProduct(shop, categories.get("do-uong"), "Cà phê sữa đá", "ca-phe-sua-da", 18000, 50, "/images/products/ca-phe-sua-da.webp", "Cà phê sữa đá năng lượng cho buổi học.");
        addProduct(shop, categories.get("do-uong"), "Nước suối Lavie", "nuoc-suoi-lavie", 8000, 120, "/images/products/nuoc-suoi-lavie.webp", "Nước suối chai nhỏ tiện mang theo.");
        addProduct(shop, categories.get("sach-va-giao-trinh"), "Giáo trình Java cơ bản", "giao-trinh-java-co-ban", 45000, 18, "/images/products/giao-trinh-java-co-ban.webp", "Giáo trình Java cơ bản cho sinh viên CNTT.");
        addProduct(shop, categories.get("sach-va-giao-trinh"), "Sách tiếng Anh A2", "sach-tieng-anh-a2", 50000, 15, "/images/products/sach-tieng-anh-a2.webp", "Sách ôn tiếng Anh A2 còn dùng tốt.");
        addProduct(shop, categories.get("do-cu-sinh-vien"), "Máy tính Casio cũ", "may-tinh-casio-cu", 90000, 7, "/images/products/may-tinh-casio-cu.webp", "Máy tính Casio đã qua sử dụng, hoạt động ổn định.");
        addProduct(shop, categories.get("do-dung-hoc-tap"), "Đèn học LED", "den-hoc-led", 89000, 14, "/images/products/den-hoc-led.webp", "Đèn học LED ánh sáng dịu.");
        addProduct(shop, categories.get("do-dung-hoc-tap"), "Bút highlight pastel", "but-highlight-pastel", 35000, 45, "/images/products/but-highlight-pastel.webp", "Bộ bút highlight pastel dùng ghi chú.");
        addProduct(shop, categories.get("cua-hang-tien-loi"), "Khăn giấy ướt mini", "khan-giay-uot-mini", 12000, 90, "/images/products/khan-giay-uot.webp", "Khăn giấy ướt mini tiện lợi.");
        addProduct(shop, categories.get("cua-hang-tien-loi"), "Khẩu trang y tế hộp 10 cái", "khau-trang-y-te-hop-10-cai", 20000, 70, "/images/products/khau-trang-y-te-hop.webp", "Khẩu trang y tế hộp 10 cái.");
        addProduct(shop, categories.get("do-dung-hoc-tap"), "Ổ cắm điện 3 lỗ", "o-cam-dien-3-lo", 45000, 20, "/images/products/o-cam-dien-3-lo.webp", "Ổ cắm điện 3 lỗ dùng trong phòng trọ.");
        addProduct(shop, categories.get("qua-tang-va-phu-kien"), "Set sticker trang trí laptop", "set-sticker-trang-tri-laptop", 15000, 65, "/images/products/set-sticker-laptop.webp", "Set sticker dễ thương để trang trí laptop.");
        addProduct(shop, categories.get("do-cu-sinh-vien"), "Bình nước SmartCart", "binh-nuoc-smartcart", 120000, 8, "/images/products/binh-nuoc-smartcart.webp", "Bình nước giữ nhiệt phong cách SmartCart.");
    }

    private Category category(String name, String slug, int order) {
        return categoryRepository.findBySlug(slug)
                .orElseGet(() -> Category.builder()
                        .name(name)
                        .slug(slug)
                        .displayOrder(order)
                        .build());
    }

    private void addProduct(Shop shop, Category category, String name, String slug, int price,
                            int stock, String imageUrl, String description) {
        productRepository.save(Product.builder()
                .shopId(shop.getId())
                .category(category)
                .name(name)
                .slug(slug)
                .description(description)
                .basePrice(BigDecimal.valueOf(price))
                .stockQuantity(stock)
                .imageUrl(imageUrl)
                .isActive(true)
                .approvalStatus("approved")
                .build());
    }
}
