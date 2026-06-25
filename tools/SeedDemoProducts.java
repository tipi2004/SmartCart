import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public class SeedDemoProducts {
    private static final String DB_URL = System.getenv().getOrDefault("DB_URL", "jdbc:postgresql://localhost:5432/smartcart");
    private static final String DB_USER = System.getenv().getOrDefault("DB_USERNAME", "postgres");
    private static final String DB_PASSWORD = System.getenv().getOrDefault("DB_PASSWORD", "postgres");

    private record CategorySeed(String name, String slug, int displayOrder) {}
    private record ProductSeed(String name, String slug, String category, int price, String description) {}

    private static final CategorySeed[] CATEGORIES = {
        new CategorySeed("Đồ uống", "do-uong", 10),
        new CategorySeed("Đồ ăn", "do-an", 20),
        new CategorySeed("Cửa hàng tiện lợi", "cua-hang-tien-loi", 30),
        new CategorySeed("Quà tặng và phụ kiện", "qua-tang-va-phu-kien", 40),
        new CategorySeed("Đồ cũ sinh viên", "do-cu-sinh-vien", 50),
        new CategorySeed("Đồ dùng học tập", "do-dung-hoc-tap", 60),
        new CategorySeed("Dịch vụ sinh viên", "dich-vu-sinh-vien", 70),
        new CategorySeed("Sách và giáo trình", "sach-va-giao-trinh", 80),
        new CategorySeed("Vật dụng sinh hoạt", "vat-dung-sinh-hoat", 90),
        new CategorySeed("Đồ dùng ký túc xá", "do-dung-ky-tuc-xa", 100)
    };

    private static final ProductSeed[] PRODUCTS = {
        new ProductSeed("Trà sữa size M", "tra-sua-size-m", "Đồ uống", 25000, "Trà sữa thơm béo, topping trân châu, phù hợp đặt nhanh trong khuôn viên trường."),
        new ProductSeed("Cà phê sữa đá", "ca-phe-sua-da", "Đồ uống", 18000, "Cà phê sữa đá đậm vị, đóng ly mang đi tiện lợi."),
        new ProductSeed("Nước suối Lavie", "nuoc-suoi-lavie", "Đồ uống", 8000, "Nước suối đóng chai, phù hợp mang theo khi đi học."),
        new ProductSeed("Bánh mì thịt trứng buổi sáng", "banh-mi-thit", "Đồ ăn", 18000, "Bánh mì nóng với thịt, trứng và rau, giao nhanh vào buổi sáng."),
        new ProductSeed("Cơm cuộn rong biển sinh viên", "com-cuon-rong-bien", "Đồ ăn", 25000, "Cơm cuộn gọn nhẹ, dễ ăn giữa giờ học."),
        new ProductSeed("Mì ly ăn liền", "mi-ly-an-lien", "Cửa hàng tiện lợi", 12000, "Mì ly tiện lợi cho ký túc xá hoặc giờ học muộn."),
        new ProductSeed("Snack khoai tây", "snack-khoai-tay", "Cửa hàng tiện lợi", 15000, "Snack giòn, vị dễ ăn, dùng cho giờ nghỉ."),
        new ProductSeed("Khăn giấy ướt mini", "khan-giay-uot", "Cửa hàng tiện lợi", 12000, "Gói khăn giấy ướt nhỏ gọn, tiện bỏ balo."),
        new ProductSeed("Khẩu trang y tế hộp 10 cái", "khau-trang-y-te-hop", "Cửa hàng tiện lợi", 20000, "Khẩu trang y tế dùng hằng ngày, hộp 10 cái."),
        new ProductSeed("Set sticker trang trí laptop", "set-sticker-laptop", "Quà tặng và phụ kiện", 15000, "Bộ sticker pastel để trang trí laptop, sổ tay hoặc bình nước."),
        new ProductSeed("Móc khóa SmartCart cute", "moc-khoa-smartcart", "Quà tặng và phụ kiện", 18000, "Móc khóa nhỏ xinh phong cách SmartCart Bunny."),
        new ProductSeed("Gấu bông mini tặng bạn", "gau-bong-mini", "Quà tặng và phụ kiện", 75000, "Gấu bông mini mềm, hợp làm quà tặng dễ thương."),
        new ProductSeed("Bình nước SmartCart", "binh-nuoc-smartcart", "Quà tặng và phụ kiện", 120000, "Bình nước cá nhân dung tích vừa, mang đi học tiện lợi."),
        new ProductSeed("Túi tote canvas", "tui-tote-canvas", "Quà tặng và phụ kiện", 65000, "Túi tote canvas nhẹ, đựng sách vở và đồ cá nhân."),
        new ProductSeed("Tai nghe Bluetooth cũ", "tai-nghe-bluetooth", "Đồ cũ sinh viên", 180000, "Tai nghe Bluetooth đã qua sử dụng, hoạt động ổn định."),
        new ProductSeed("Sạc dự phòng 10000mAh", "sac-du-phong-10000mah", "Đồ cũ sinh viên", 150000, "Sạc dự phòng còn tốt, phù hợp mang theo khi học cả ngày."),
        new ProductSeed("Chuột không dây", "chuot-khong-day", "Đồ cũ sinh viên", 90000, "Chuột không dây cũ, dùng tốt cho laptop và học online."),
        new ProductSeed("Bút highlight pastel", "but-highlight-pastel", "Đồ dùng học tập", 35000, "Set bút highlight màu pastel, ghi chú bài học dễ nhìn."),
        new ProductSeed("Vở kẻ ngang 80 trang", "vo-ke-ngang-80-trang", "Đồ dùng học tập", 12000, "Vở kẻ ngang 80 trang cho ghi chép hằng ngày."),
        new ProductSeed("Máy tính Casio cũ", "may-tinh-casio-cu", "Đồ cũ sinh viên", 220000, "Máy tính Casio đã qua sử dụng, phù hợp học tập và thi cử."),
        new ProductSeed("In tài liệu đen trắng 50 trang", "in-tai-lieu-den-trang", "Dịch vụ sinh viên", 25000, "Dịch vụ in tài liệu đen trắng, nhận file và hẹn lấy quanh trường."),
        new ProductSeed("Giáo trình Java cơ bản", "giao-trinh-java-co-ban", "Sách và giáo trình", 45000, "Giáo trình Java cơ bản, phù hợp sinh viên CNTT năm đầu."),
        new ProductSeed("Sách tiếng Anh A2", "sach-tieng-anh-a2", "Sách và giáo trình", 50000, "Sách luyện tiếng Anh trình độ A2, còn dùng tốt."),
        new ProductSeed("Sách Kinh tế vi mô", "sach-kinh-te-vi-mo", "Sách và giáo trình", 55000, "Sách Kinh tế vi mô cho sinh viên khối kinh tế."),
        new ProductSeed("Đèn học LED để bàn", "den-hoc-led", "Vật dụng sinh hoạt", 89000, "Đèn học LED nhỏ gọn, ánh sáng dịu cho bàn học."),
        new ProductSeed("Quạt bàn Senko mini", "quat-ban-senko-mini", "Đồ dùng ký túc xá", 85000, "Quạt bàn mini dùng tốt trong phòng ký túc xá."),
        new ProductSeed("Móc treo quần áo 10 cái", "moc-treo-quan-ao", "Đồ dùng ký túc xá", 25000, "Bộ 10 móc treo quần áo nhựa, gọn nhẹ."),
        new ProductSeed("Bàn nhựa gấp gọn Duy Tân", "ban-nhua-gap-gon", "Đồ dùng ký túc xá", 65000, "Bàn nhựa gấp gọn, dùng để học hoặc ăn cơm trong phòng."),
        new ProductSeed("Ổ cắm điện 3 lỗ", "o-cam-dien-3-lo", "Đồ dùng ký túc xá", 45000, "Ổ cắm điện 3 lỗ, dây dài vừa phải cho bàn học."),
        new ProductSeed("Hộp đựng đồ mini", "hop-dung-do-mini", "Đồ dùng ký túc xá", 30000, "Hộp đựng đồ mini giúp bàn học gọn gàng hơn.")
    };

    public static void main(String[] args) throws Exception {
        Class.forName("org.postgresql.Driver");
        try (Connection connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            connection.setAutoCommit(false);
            ensureColumns(connection);
            UUID sellerId = upsertSeller(connection);
            UUID shopId = upsertShop(connection, sellerId);
            Map<String, UUID> categoryIds = upsertCategories(connection);
            int count = upsertProducts(connection, shopId, categoryIds);
            connection.commit();
            System.out.println("Seeded/updated " + count + " demo products with local images.");
        }
    }

    private static void ensureColumns(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
            statement.execute("ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text");
            statement.execute("ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved'");
            statement.execute("ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rejection_reason text");
        }
    }

    private static UUID upsertSeller(Connection connection) throws Exception {
        String sql = """
            INSERT INTO public.users(full_name, email, phone, password_hash, role, is_active)
            VALUES (?, ?, ?, ?, ?, true)
            ON CONFLICT (email) DO UPDATE
            SET full_name = EXCLUDED.full_name,
                phone = EXCLUDED.phone,
                role = EXCLUDED.role,
                is_active = true
            RETURNING id
            """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, "SmartCart Demo Seller");
            statement.setString(2, "demo.seller@smartcart.local");
            statement.setString(3, "0900000001");
            statement.setString(4, "");
            statement.setString(5, "seller");
            try (ResultSet rs = statement.executeQuery()) {
                rs.next();
                return rs.getObject("id", UUID.class);
            }
        }
    }

    private static UUID upsertShop(Connection connection, UUID sellerId) throws Exception {
        String sql = """
            INSERT INTO public.shops(owner_id, name, slug, status, is_verified)
            VALUES (?, ?, ?, 'active', true)
            ON CONFLICT (slug) DO UPDATE
            SET owner_id = EXCLUDED.owner_id,
                name = EXCLUDED.name,
                status = 'active',
                is_verified = true
            RETURNING id
            """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, sellerId);
            statement.setString(2, "SmartCart Campus Shop");
            statement.setString(3, "smartcart-campus-shop");
            try (ResultSet rs = statement.executeQuery()) {
                rs.next();
                return rs.getObject("id", UUID.class);
            }
        }
    }

    private static Map<String, UUID> upsertCategories(Connection connection) throws Exception {
        Map<String, UUID> categoryIds = new LinkedHashMap<>();
        for (CategorySeed seed : CATEGORIES) {
            UUID existingId = findCategoryByName(connection, seed.name());
            if (existingId != null) {
                categoryIds.put(seed.name(), existingId);
                continue;
            }

            String sql = """
                INSERT INTO public.categories(name, slug, display_order)
                VALUES (?, ?, ?)
                ON CONFLICT (slug) DO UPDATE
                SET name = EXCLUDED.name,
                    display_order = EXCLUDED.display_order
                RETURNING id
                """;
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setString(1, seed.name());
                statement.setString(2, seed.slug());
                statement.setInt(3, seed.displayOrder());
                try (ResultSet rs = statement.executeQuery()) {
                    rs.next();
                    categoryIds.put(seed.name(), rs.getObject("id", UUID.class));
                }
            }
        }
        return categoryIds;
    }

    private static UUID findCategoryByName(Connection connection, String name) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement("SELECT id FROM public.categories WHERE name = ? LIMIT 1")) {
            statement.setString(1, name);
            try (ResultSet rs = statement.executeQuery()) {
                return rs.next() ? rs.getObject("id", UUID.class) : null;
            }
        }
    }

    private static int upsertProducts(Connection connection, UUID shopId, Map<String, UUID> categoryIds) throws Exception {
        String sql = """
            INSERT INTO public.products(shop_id, category_id, name, slug, description, base_price, image_url, is_active, approval_status, rejection_reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, true, 'approved', NULL)
            ON CONFLICT (shop_id, slug) DO UPDATE
            SET category_id = EXCLUDED.category_id,
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                base_price = EXCLUDED.base_price,
                image_url = EXCLUDED.image_url,
                is_active = true,
                approval_status = 'approved',
                rejection_reason = NULL
            """;
        int count = 0;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            for (ProductSeed seed : PRODUCTS) {
                statement.setObject(1, shopId);
                statement.setObject(2, categoryIds.get(seed.category()));
                statement.setString(3, seed.name());
                statement.setString(4, seed.slug());
                statement.setString(5, seed.description());
                statement.setBigDecimal(6, BigDecimal.valueOf(seed.price()));
                statement.setString(7, "/images/products/" + seed.slug() + ".webp");
                statement.addBatch();
                count++;
            }
            statement.executeBatch();
        }
        return count;
    }
}
