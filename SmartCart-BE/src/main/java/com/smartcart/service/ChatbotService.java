package com.smartcart.service;

import com.smartcart.dto.request.ChatRequest;
import com.smartcart.dto.response.ChatActionResponse;
import com.smartcart.dto.response.ChatMessageResponse;
import com.smartcart.dto.response.ChatResponse;
import com.smartcart.entity.ChatMessage;
import com.smartcart.entity.ChatSession;
import com.smartcart.entity.Order;
import com.smartcart.entity.Product;
import com.smartcart.entity.User;
import com.smartcart.exception.BusinessException;
import com.smartcart.exception.ResourceNotFoundException;
import com.smartcart.repository.ChatMessageRepository;
import com.smartcart.repository.ChatSessionRepository;
import com.smartcart.repository.OrderRepository;
import com.smartcart.repository.ProductRepository;
import com.smartcart.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatbotService {

    private static final int MAX_SUGGESTIONS = 4;

    private static final List<String> SEARCH_INTENT_WORDS = List.of(
            "tim", "kiem", "mua", "can mua", "goi y", "goi y cho minh", "co ban", "co mon", "co san pham",
            "gia re", "duoi", "toi da", "nho hon", "khoang", "tam", "nen mua", "muon mua"
    );

    private static final List<String> PRODUCT_DOMAIN_WORDS = List.of(
            "do an", "do uong", "nuoc", "tra sua", "ca phe", "banh mi", "snack", "mi ly", "com cuon", "trai cay",
            "sach", "giao trinh", "hoc tap", "do hoc", "but", "vo", "tai lieu", "in tai lieu",
            "ky tuc", "ky tuc xa", "o cam", "quat", "den hoc", "ban nhua", "ban hoc", "ban",
            "qua tang", "phu kien", "moc khoa", "gau bong", "sticker",
            "do cu", "tai nghe", "sac du phong", "chuot", "binh nuoc", "tui tote", "khau trang", "khan giay"
    );

    private static final List<String> STOP_WORDS = List.of(
            "tim", "kiem", "mua", "can", "toi", "minh", "cho", "duoi", "tren", "san", "pham", "gia",
            "goi", "y", "co", "khong", "voi", "nhe", "nha", "smartcart", "bot", "oi", "la",
            "nhung", "mot", "cai", "chiec", "loai", "nao", "gi", "duoc", "khong", "muon"
    );

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.api-url:}")
    private String geminiApiUrl;

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final WebClient webClient;

    public ChatbotService(ChatSessionRepository sessionRepository,
                          ChatMessageRepository messageRepository,
                          UserRepository userRepository,
                          ProductRepository productRepository,
                          OrderRepository orderRepository,
                          WebClient.Builder webClientBuilder) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.webClient = webClientBuilder.build();
    }

    @Transactional
    public ChatResponse chat(String email, ChatRequest request) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new BusinessException("Tin nhắn không được để trống.");
        }

        User user = null;
        ChatSession session = null;
        if (email != null && !email.isBlank()) {
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
            var currentUserId = user.getId();
            session = sessionRepository.findByUserId(currentUserId).orElseGet(() -> {
                ChatSession newSession = ChatSession.builder()
                        .userId(currentUserId)
                        .messages(new ArrayList<>())
                        .build();
                return sessionRepository.save(newSession);
            });

            messageRepository.save(ChatMessage.builder()
                    .session(session)
                    .role("user")
                    .content(request.getMessage().trim())
                    .build());
        }

        ChatResponse response = buildSmartReply(user, request.getMessage());

        if (session != null) {
            messageRepository.save(ChatMessage.builder()
                    .session(session)
                    .role("assistant")
                    .content(response.getReply())
                    .build());
        }

        return response;
    }

    public List<ChatMessageResponse> getHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
        return sessionRepository.findByUserId(user.getId())
                .map(session -> messageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId())
                        .stream().map(ChatMessageResponse::from).toList())
                .orElse(List.of());
    }

    @Transactional
    public void clearHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
        sessionRepository.findByUserId(user.getId()).ifPresent(session -> {
            messageRepository.deleteBySessionId(session.getId());
            sessionRepository.delete(session);
        });
    }

    private ChatResponse buildSmartReply(User user, String userMessage) {
        ChatIntent intent = detectIntent(userMessage);

        return switch (intent) {
            case GREETING -> buildGreetingReply();
            case PRODUCT_SEARCH -> buildProductSearchReply(userMessage);
            case ORDER_TRACKING -> buildOrderReply(user);
            case CART_HELP -> buildCartReply(user);
            case PAYMENT_HELP -> buildPaymentReply();
            case SELLER_HELP -> buildSellerReply(user);
            case HELP -> buildHelpReply();
            case UNKNOWN -> buildFallbackReply(userMessage);
        };
    }

    private ChatIntent detectIntent(String userMessage) {
        String text = normalize(userMessage).trim();

        if (text.matches("^(alo|hello|hi|hey|xin chao|chao|chao ban|bot oi|smartcart oi)[!.?\\s]*$")) {
            return ChatIntent.GREETING;
        }

        if (containsAny(text, "don hang", "trang thai don", "kiem tra don", "lich su mua", "don cua toi", "da dat")) {
            return ChatIntent.ORDER_TRACKING;
        }

        if (containsAny(text, "thanh toan", "qr", "chuyen khoan", "ngan hang", "cod", "tien mat", "payment")) {
            return ChatIntent.PAYMENT_HELP;
        }

        if (containsAny(text, "gio hang", "checkout", "dat hang", "mua ngay", "them vao gio")) {
            return ChatIntent.CART_HELP;
        }

        if (containsAny(text, "dang ban", "ban hang", "seller", "kenh ban", "shop cua toi", "dang san pham", "tao san pham")) {
            return ChatIntent.SELLER_HELP;
        }

        if (containsAny(text, "huong dan", "giup", "lam gi", "chuc nang", "ban lam duoc gi", "bot lam duoc gi")) {
            return ChatIntent.HELP;
        }

        if (hasProductSearchIntent(text)) {
            return ChatIntent.PRODUCT_SEARCH;
        }

        return ChatIntent.UNKNOWN;
    }

    private boolean hasProductSearchIntent(String text) {
        boolean hasExplicitSearchIntent = SEARCH_INTENT_WORDS.stream().anyMatch(text::contains);
        boolean hasProductDomain = PRODUCT_DOMAIN_WORDS.stream().anyMatch(text::contains);
        boolean hasPriceFilter = extractMaxPrice(text) != null;

        return hasExplicitSearchIntent
                || hasPriceFilter
                || (hasProductDomain && (text.length() <= 45 || containsAny(text, "co", "mua", "tim", "can", "goi y")));
    }

    private ChatResponse buildGreetingReply() {
        return new ChatResponse(
                "Chào bạn, mình là SmartCart Bot.\n"
                        + "Mình có thể giúp bạn tìm sản phẩm, xem giỏ hàng, kiểm tra đơn hàng hoặc hướng dẫn đăng bán.\n"
                        + "Bạn muốn làm gì trước?",
                defaultActions()
        );
    }

    private ChatResponse buildHelpReply() {
        return new ChatResponse(
                "Mình hỗ trợ nhanh các việc này:\n"
                        + "1. Tìm sản phẩm theo tên, danh mục hoặc mức giá.\n"
                        + "2. Gợi ý đồ ăn, đồ uống, sách, đồ ký túc xá, quà tặng.\n"
                        + "3. Kiểm tra đơn hàng gần nhất nếu bạn đã đăng nhập.\n"
                        + "4. Hướng dẫn mở giỏ hàng, thanh toán hoặc đăng bán sản phẩm.\n\n"
                        + "Ví dụ: \"tìm đồ uống dưới 30k\" hoặc \"kiểm tra đơn hàng của tôi\".",
                defaultActions()
        );
    }

    private ChatResponse buildCartReply(User user) {
        if (user == null) {
            return new ChatResponse(
                    "Bạn cần đăng nhập trước khi xem giỏ hàng hoặc đặt hàng.\n"
                            + "Nếu chỉ muốn tìm sản phẩm, bạn có thể hỏi mình ngay, ví dụ: \"tìm đồ học dưới 50k\".",
                    List.of(
                            new ChatActionResponse("Đăng nhập", "/#shop", "login"),
                            new ChatActionResponse("Tìm sản phẩm", "/#shop", "link")
                    )
            );
        }

        return new ChatResponse(
                "Bạn có thể mở giỏ hàng để chọn sản phẩm, chỉnh số lượng và thanh toán.",
                List.of(new ChatActionResponse("Mở giỏ hàng", "/cart", "link"))
        );
    }

    private ChatResponse buildPaymentReply() {
        return new ChatResponse(
                "SmartCart hiện hỗ trợ thanh toán khi nhận hàng (COD).\n"
                        + "Luồng chuyển khoản/QR đang được chuẩn bị: đơn sẽ ở trạng thái chờ xác nhận chuyển khoản để admin hoặc người bán kiểm tra.\n"
                        + "Bạn có thể đặt hàng bằng COD trước, sau đó theo dõi trạng thái trong trang đơn hàng.",
                List.of(
                        new ChatActionResponse("Mở giỏ hàng", "/cart", "link"),
                        new ChatActionResponse("Xem đơn hàng", "/orders", "link")
                )
        );
    }

    private ChatResponse buildSellerReply(User user) {
        if (user == null) {
            return new ChatResponse(
                    "Bạn cần đăng nhập để vào kênh bán hàng.\n"
                            + "Sau khi đăng nhập, bạn có thể đăng sản phẩm, upload ảnh, sửa thông tin và theo dõi đơn của shop.",
                    List.of(new ChatActionResponse("Đăng nhập", "/#shop", "login"))
            );
        }

        return new ChatResponse(
                "Bạn có thể vào kênh bán hàng để đăng sản phẩm, upload ảnh, chỉnh thông tin và theo dõi đơn của shop.\n"
                        + "Sản phẩm mới sẽ cần admin duyệt trước khi hiển thị cho người mua.",
                List.of(new ChatActionResponse("Vào kênh bán hàng", "/seller", "link"))
        );
    }

    private ChatResponse buildOrderReply(User user) {
        if (user == null) {
            return new ChatResponse(
                    "Bạn cần đăng nhập để mình kiểm tra đơn hàng của bạn.\n"
                            + "Sau khi đăng nhập, mình có thể xem đơn gần nhất và đưa bạn đến trang đơn hàng.",
                    List.of(new ChatActionResponse("Đăng nhập", "/#shop", "login"))
            );
        }

        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        if (orders.isEmpty()) {
            return new ChatResponse(
                    "Bạn chưa có đơn hàng nào.\n"
                            + "Bạn có thể xem sản phẩm ở cửa hàng rồi thêm vào giỏ để đặt đơn đầu tiên.",
                    List.of(new ChatActionResponse("Đi mua sắm", "/#shop", "link"))
            );
        }

        Order latest = orders.get(0);
        String status = orderStatusLabel(latest.getStatus());
        String paymentStatus = paymentStatusLabel(latest.getPaymentStatus());
        String orderCode = latest.getId().toString().substring(0, 8).toUpperCase();

        String reply = "Đơn gần nhất của bạn là #" + orderCode + ".\n"
                + "- Trạng thái đơn: " + status + "\n"
                + "- Thanh toán: " + paymentStatus + "\n"
                + "- Phí vận chuyển: " + formatMoney(latest.getShippingFee()) + "\n"
                + "- Tổng tiền: " + formatMoney(latest.getTotalAmount()) + "\n\n"
                + "Bạn có thể mở trang đơn hàng để xem chi tiết hoặc hủy đơn nếu đơn còn cho phép.";

        return new ChatResponse(reply, List.of(new ChatActionResponse("Xem đơn hàng", "/orders", "link")));
    }

    private ChatResponse buildProductSearchReply(String userMessage) {
        ProductSearchResult result = searchProducts(userMessage);

        if (result.products().isEmpty()) {
            return new ChatResponse(
                    "Mình chưa tìm thấy sản phẩm phù hợp.\n"
                            + "Bạn thử nói rõ hơn tên món, danh mục hoặc mức giá nhé. Ví dụ: \"tìm đồ ăn dưới 30k\".",
                    List.of(new ChatActionResponse("Xem cửa hàng", "/#shop", "link"))
            );
        }

        StringBuilder reply = new StringBuilder();
        reply.append("Mình tìm thấy ")
                .append(Math.min(result.products().size(), MAX_SUGGESTIONS))
                .append(" sản phẩm phù hợp");
        if (result.maxPrice() != null) {
            reply.append(" dưới ").append(formatMoney(result.maxPrice()));
        }
        reply.append(":\n");

        for (int i = 0; i < Math.min(result.products().size(), MAX_SUGGESTIONS); i++) {
            Product product = result.products().get(i);
            reply.append(i + 1)
                    .append(". ")
                    .append(product.getName())
                    .append(" - ")
                    .append(formatMoney(product.getBasePrice()));
            if (product.getCategory() != null) {
                reply.append(" (").append(product.getCategory().getName()).append(")");
            }
            reply.append("\n");
        }
        reply.append("\nBạn muốn xem sản phẩm nào?");

        List<ChatActionResponse> actions = result.products().stream()
                .limit(3)
                .map(product -> new ChatActionResponse(
                        "Xem " + shortName(product.getName()),
                        product.getId().toString(),
                        "product"
                ))
                .toList();

        return new ChatResponse(reply.toString().trim(), actions);
    }

    private ChatResponse buildFallbackReply(String userMessage) {
        if (shouldUseGemini(userMessage)) {
            String reply = callGeminiApi(buildContext(), userMessage);
            return new ChatResponse(reply, defaultActions());
        }

        return new ChatResponse(
                "Mình chưa hiểu rõ nhu cầu của bạn.\n"
                        + "Bạn có thể hỏi theo mẫu như:\n"
                        + "- tìm đồ uống dưới 30k\n"
                        + "- gợi ý đồ học tập giá rẻ\n"
                        + "- kiểm tra đơn hàng của tôi\n"
                        + "- hướng dẫn đăng bán sản phẩm",
                defaultActions()
        );
    }

    private ProductSearchResult searchProducts(String userMessage) {
        String normalizedMessage = normalize(userMessage);
        BigDecimal maxPrice = extractMaxPrice(normalizedMessage);
        List<SearchKeyword> keywords = extractProductKeywords(userMessage);

        List<ScoredProduct> scoredProducts = productRepository.findPublicProducts().stream()
                .filter(product -> maxPrice == null || product.getBasePrice().compareTo(maxPrice) <= 0)
                .map(product -> new ScoredProduct(product, scoreProduct(product, keywords, normalizedMessage)))
                .filter(scored -> scored.score() >= minimumScore(keywords, normalizedMessage))
                .sorted(Comparator
                        .comparingInt(ScoredProduct::score).reversed()
                        .thenComparing(scored -> scored.product().getBasePrice()))
                .limit(8)
                .toList();

        return new ProductSearchResult(scoredProducts.stream().map(ScoredProduct::product).toList(), maxPrice);
    }

    private int minimumScore(List<SearchKeyword> keywords, String normalizedMessage) {
        if (keywords.isEmpty()) return 2;
        if (containsAny(normalizedMessage, "ban", "do hoc", "nuoc")) return 4;
        return 3;
    }

    private List<SearchKeyword> extractProductKeywords(String userMessage) {
        Set<SearchKeyword> keywords = new LinkedHashSet<>();

        Pattern.compile("[\\p{L}0-9]+")
                .matcher(userMessage.toLowerCase(Locale.ROOT))
                .results()
                .map(match -> match.group())
                .map(word -> new SearchKeyword(word, normalize(word), hasDiacritics(word)))
                .filter(keyword -> keyword.normalized().length() >= 2
                        && !STOP_WORDS.contains(keyword.normalized())
                        && !keyword.normalized().matches("\\d+k?"))
                .forEach(keywords::add);

        String normalizedMessage = normalize(userMessage);
        if (containsAny(normalizedMessage, "do hoc", "hoc tap")) {
            keywords.add(new SearchKeyword("học tập", "hoc tap", true));
            keywords.add(new SearchKeyword("sách", "sach", true));
            keywords.add(new SearchKeyword("bút", "but", true));
        }
        if (containsAny(normalizedMessage, "nuoc", "do uong")) {
            keywords.add(new SearchKeyword("đồ uống", "do uong", true));
            keywords.add(new SearchKeyword("trà sữa", "tra sua", true));
            keywords.add(new SearchKeyword("bình nước", "binh nuoc", true));
            keywords.add(new SearchKeyword("cà phê", "ca phe", true));
        }
        if (containsAny(normalizedMessage, "do an", "mon an", "an vat", "do an vat")) {
            keywords.add(new SearchKeyword("đồ ăn", "do an", true));
            keywords.add(new SearchKeyword("bánh mì", "banh mi", true));
            keywords.add(new SearchKeyword("mì ly", "mi ly", true));
            keywords.add(new SearchKeyword("snack", "snack", false));
            keywords.add(new SearchKeyword("cơm cuộn", "com cuon", true));
            keywords.add(new SearchKeyword("trái cây", "trai cay", true));
        }
        if (containsAny(normalizedMessage, "ban hoc", "ban nhua") || containsWord(normalizedMessage, "ban")) {
            keywords.add(new SearchKeyword("bàn", "ban", true));
            keywords.add(new SearchKeyword("bàn nhựa", "ban nhua", true));
            keywords.add(new SearchKeyword("bàn học", "ban hoc", true));
        }

        return new ArrayList<>(keywords);
    }

    private int scoreProduct(Product product, List<SearchKeyword> keywords, String normalizedMessage) {
        String nameRaw = safeLower(product.getName());
        String categoryRaw = safeLower(product.getCategory() != null ? product.getCategory().getName() : "");
        String descriptionRaw = safeLower(product.getDescription());
        String productText = normalize(nameRaw + " " + categoryRaw + " " + descriptionRaw);
        String nameText = normalize(nameRaw);
        String categoryText = normalize(categoryRaw);
        String descriptionText = normalize(descriptionRaw);
        int score = 0;

        for (SearchKeyword keyword : keywords) {
            if (keyword.hasDiacritics()) {
                if (containsWord(nameRaw, keyword.raw())) score += 18;
                if (containsWord(categoryRaw, keyword.raw())) score += 10;
                if (containsWord(descriptionRaw, keyword.raw())) score += 4;
            }

            if (containsWord(nameText, keyword.normalized())) score += 12;
            if (containsWord(categoryText, keyword.normalized())) score += 8;
            if (containsWord(descriptionText, keyword.normalized())) score += 3;
            if (keyword.normalized().length() >= 4 && productText.contains(keyword.normalized())) score += 2;
        }

        for (String domainWord : PRODUCT_DOMAIN_WORDS) {
            if (normalizedMessage.contains(domainWord) && productText.contains(domainWord)) {
                score += 5;
            }
        }

        if (containsAny(normalizedMessage, "gia re", "re", "sinh vien", "tiet kiem")
                && product.getBasePrice().compareTo(BigDecimal.valueOf(30000)) <= 0) {
            score += 2;
        }

        return score;
    }

    private boolean shouldUseGemini(String userMessage) {
        String text = normalize(userMessage);
        return geminiApiKey != null
                && !geminiApiKey.isBlank()
                && geminiApiUrl != null
                && !geminiApiUrl.isBlank()
                && text.length() >= 18
                && !text.matches("^[a-z0-9\\s!?.,]{1,20}$");
    }

    private String buildContext() {
        List<Product> products = productRepository.findPublicProducts();
        StringBuilder sb = new StringBuilder("Bạn là chatbot hỗ trợ sinh viên mua bán trong SmartCart.\n\n");
        sb.append("Một số sản phẩm hiện có:\n");
        products.stream().limit(20).forEach(product ->
                sb.append("- ")
                        .append(product.getName())
                        .append(": ")
                        .append(formatMoney(product.getBasePrice()))
                        .append("\n"));
        sb.append("\nTrả lời ngắn gọn, thân thiện. Nếu người dùng hỏi mơ hồ, hãy hỏi lại thay vì tự bịa sản phẩm, giá, đơn hàng hoặc chính sách.");
        return sb.toString();
    }

    private String callGeminiApi(String context, String userMessage) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return "Mình có thể giúp bạn tìm sản phẩm, mở giỏ hàng, kiểm tra đơn hàng hoặc hướng dẫn đăng bán. Bạn thử hỏi: \"tìm đồ uống dưới 30k\" nhé.";
        }

        String url = geminiApiUrl + "?key=" + geminiApiKey;
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", context + "\n\nUser: " + userMessage)))
                )
        );

        try {
            Map<String, Object> response = webClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null || !response.containsKey("candidates")) {
                throw new BusinessException("Gemini API trả về lỗi hoặc không có dữ liệu.");
            }

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates.isEmpty()) {
                throw new BusinessException("Gemini API không trả về kết quả.");
            }

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return ((String) parts.get(0).get("text")).trim();
        } catch (Exception e) {
            return "Mình chưa gọi được AI lúc này, nhưng vẫn có thể tìm sản phẩm hoặc kiểm tra đơn hàng cho bạn. Bạn thử hỏi: \"tìm đồ học tập dưới 50k\".";
        }
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) return true;
        }
        return false;
    }

    private boolean containsWord(String text, String keyword) {
        return Pattern.compile("(^|[^\\p{L}0-9])" + Pattern.quote(keyword) + "([^\\p{L}0-9]|$)").matcher(text).find();
    }

    private boolean hasDiacritics(String value) {
        return !value.equals(normalize(value));
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private BigDecimal extractMaxPrice(String normalizedMessage) {
        Matcher matcher = Pattern.compile("(?:duoi|toi da|nho hon|<|tam|khoang)\\s*(\\d+)(k|nghin|000)?").matcher(normalizedMessage);
        if (!matcher.find()) return null;

        BigDecimal value = new BigDecimal(matcher.group(1));
        String unit = matcher.group(2);
        if ("k".equals(unit) || "nghin".equals(unit) || value.compareTo(BigDecimal.valueOf(1000)) < 0) {
            return value.multiply(BigDecimal.valueOf(1000));
        }
        return value;
    }

    private String normalize(String value) {
        if (value == null) return "";
        String normalized = Normalizer.normalize(value.toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "").replace("đ", "d");
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0đ";
        return String.format("%,.0fđ", amount).replace(",", ".");
    }

    private String shortName(String name) {
        return name.length() <= 22 ? name : name.substring(0, 19).trim() + "...";
    }

    private String orderStatusLabel(String status) {
        if ("confirmed".equals(status)) return "đã xác nhận";
        if ("cancelled".equals(status)) return "đã hủy";
        return "chờ xác nhận";
    }

    private String paymentStatusLabel(String paymentStatus) {
        if ("paid".equals(paymentStatus)) return "đã thanh toán";
        if ("processing".equals(paymentStatus)) return "chờ xác nhận chuyển khoản";
        if ("failed".equals(paymentStatus)) return "thanh toán thất bại/quá hạn";
        return "chờ thanh toán";
    }

    private List<ChatActionResponse> defaultActions() {
        return List.of(
                new ChatActionResponse("Tìm đồ ăn", "tìm đồ ăn", "prompt"),
                new ChatActionResponse("Đồ uống dưới 30k", "tìm đồ uống dưới 30k", "prompt"),
                new ChatActionResponse("Xem giỏ hàng", "/cart", "link"),
                new ChatActionResponse("Kiểm tra đơn", "/orders", "link")
        );
    }

    private enum ChatIntent {
        GREETING,
        PRODUCT_SEARCH,
        ORDER_TRACKING,
        CART_HELP,
        PAYMENT_HELP,
        SELLER_HELP,
        HELP,
        UNKNOWN
    }

    private record ProductSearchResult(List<Product> products, BigDecimal maxPrice) {}
    private record ScoredProduct(Product product, int score) {}
    private record SearchKeyword(String raw, String normalized, boolean hasDiacritics) {}
}
