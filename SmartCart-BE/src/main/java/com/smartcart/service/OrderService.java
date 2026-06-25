package com.smartcart.service;

import com.smartcart.dto.request.CreateOrderRequest;
import com.smartcart.dto.request.PaymentWebhookRequest;
import com.smartcart.dto.response.OrderResponse;
import com.smartcart.entity.Cart;
import com.smartcart.entity.CartItem;
import com.smartcart.entity.Order;
import com.smartcart.entity.OrderItem;
import com.smartcart.entity.Product;
import com.smartcart.entity.Shop;
import com.smartcart.entity.User;
import com.smartcart.exception.BusinessException;
import com.smartcart.exception.ResourceNotFoundException;
import com.smartcart.repository.CartRepository;
import com.smartcart.repository.OrderRepository;
import com.smartcart.repository.ProductRepository;
import com.smartcart.repository.ShopRepository;
import com.smartcart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final List<String> SUPPORTED_PAYMENT_METHODS = List.of("cod", "bank_transfer", "qr");

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final EmailNotificationService emailNotificationService;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository,
                        CartRepository cartRepository, ProductRepository productRepository,
                        ShopRepository shopRepository, EmailNotificationService emailNotificationService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public OrderResponse createOrder(String email, CreateOrderRequest request) {
        if (request == null || request.getShippingAddress() == null || request.getShippingAddress().trim().isEmpty()) {
            throw new BusinessException("Dia chi giao hang khong duoc de trong.");
        }

        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));

        Cart cart = cartRepository.findByUser(buyer)
                .orElseThrow(() -> new BusinessException("Gio hang trong. Hay them san pham truoc khi dat hang."));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BusinessException("Gio hang trong. Hay them san pham truoc khi dat hang.");
        }

        List<UUID> selectedItemIds = request.getSelectedItemIds();
        List<CartItem> selectedCartItems = selectedItemIds == null || selectedItemIds.isEmpty()
                ? List.copyOf(cart.getItems())
                : cart.getItems().stream()
                        .filter(cartItem -> selectedItemIds.contains(cartItem.getId()))
                        .toList();

        if (selectedCartItems.isEmpty()) {
            throw new BusinessException("Vui long chon san pham can dat hang.");
        }

        if (selectedItemIds != null && !selectedItemIds.isEmpty() && selectedCartItems.size() != selectedItemIds.size()) {
            throw new BusinessException("Mot so san pham duoc chon khong nam trong gio hang.");
        }

        // Tao danh sach OrderItem tu CartItem, snapshot gia tai thoi diem dat hang
        List<OrderItem> orderItems = selectedCartItems.stream().map(cartItem -> {
            Product product = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("San pham", cartItem.getProduct().getId()));
            if (!Boolean.TRUE.equals(product.getIsActive())) {
                throw new BusinessException("San pham '" + product.getName() + "' hien khong con ban.");
            }

            BigDecimal price = product.getBasePrice();
            int qty = cartItem.getQuantity();
            int currentStock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
            if (currentStock < qty) {
                throw new BusinessException("San pham '" + product.getName() + "' chi con " + currentStock + " san pham trong kho.");
            }
            product.setStockQuantity(currentStock - qty);
            if (product.getStockQuantity() == 0) {
                product.setIsActive(false);
            }
            productRepository.save(product);

            return OrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .priceAtOrder(price)
                    .quantity(qty)
                    .subtotal(price.multiply(BigDecimal.valueOf(qty)))
                    .build();
        }).toList();

        BigDecimal total = orderItems.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal shippingFee = request.getShippingFee() == null ? BigDecimal.ZERO : request.getShippingFee();
        if (shippingFee.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Phi van chuyen khong hop le.");
        }
        String paymentMethod = request.getPaymentMethod() == null || request.getPaymentMethod().isBlank()
                ? "cod"
                : request.getPaymentMethod().trim();
        if (!SUPPORTED_PAYMENT_METHODS.contains(paymentMethod)) {
            throw new BusinessException("Phuong thuc thanh toan khong hop le.");
        }
        String paymentStatus = "paid";
        LocalDateTime paymentExpiresAt = null;

        Order order = Order.builder()
                .userId(buyer.getId())
                .status("confirmed")
                .totalAmount(total.add(shippingFee))
                .shippingFee(shippingFee)
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .paymentExpiresAt(paymentExpiresAt)
                .shippingAddress(request.getShippingAddress().trim())
                .note(request.getNote())
                .items(orderItems)
                .build();

        // Gan order vao tung item (JPA can lien ket 2 chieu)
        orderItems.forEach(item -> item.setOrder(order));

        Order saved = orderRepository.save(order);

        // Xoa cac item da dat hang, giu lai item chua duoc tick trong gio
        cart.getItems().removeIf(cartItem -> selectedCartItems.stream()
                .anyMatch(selectedItem -> selectedItem.getId().equals(cartItem.getId())));
        cartRepository.save(cart);

        // Gui email thong bao bat dong bo
        emailNotificationService.sendOrderConfirmationToBuyer(buyer, saved);
        notifySellers(saved);

        return OrderResponse.from(saved);
    }

    // Tim cac seller lien quan den don hang va gui email thong bao
    private void notifySellers(Order order) {
        if (order.getItems() == null) return;

        // Lay danh sach shopId duy nhat tu cac san pham trong don hang
        List<UUID> shopIds = order.getItems().stream()
                .map(item -> productRepository.findById(item.getProductId()))
                .filter(java.util.Optional::isPresent)
                .map(opt -> opt.get().getShopId())
                .distinct()
                .collect(Collectors.toList());

        // Lay danh sach owner (seller) cua cac shop do
        List<User> sellers = shopIds.stream()
                .map(shopId -> shopRepository.findById(shopId))
                .filter(java.util.Optional::isPresent)
                .map(opt -> opt.get().getOwnerId())
                .distinct()
                .map(ownerId -> userRepository.findById(ownerId))
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .collect(Collectors.toList());

        if (!sellers.isEmpty()) {
            emailNotificationService.sendNewOrderNotificationToSellers(order, sellers);
        }
    }

    public List<OrderResponse> getMyOrders(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(OrderResponse::from).toList();
    }

    public OrderResponse getOrderById(String email, UUID orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Don hang", orderId));
        if (!order.getUserId().equals(user.getId())) {
            throw new BusinessException("Ban khong co quyen xem don hang nay.");
        }
        return OrderResponse.from(order);
    }

    public OrderResponse lookupOrder(String email, UUID orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Don hang", orderId));

        if ("admin".equalsIgnoreCase(user.getRole()) || order.getUserId().equals(user.getId())) {
            return OrderResponse.from(order);
        }

        Shop sellerShop = shopRepository.findByOwnerId(user.getId()).orElse(null);
        if (sellerShop == null || order.getItems() == null) {
            throw new BusinessException("Ban khong co quyen xem don hang nay.");
        }

        Set<UUID> sellerProductIds = order.getItems().stream()
                .map(item -> productRepository.findById(item.getProductId()).orElse(null))
                .filter(product -> product != null && sellerShop.getId().equals(product.getShopId()))
                .map(Product::getId)
                .collect(Collectors.toSet());

        if (sellerProductIds.isEmpty()) {
            throw new BusinessException("Ban khong co quyen xem don hang nay.");
        }

        return OrderResponse.fromSeller(order, sellerProductIds);
    }

    @Transactional
    public OrderResponse cancelOrder(String email, UUID orderId) {
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Don hang", orderId));

        if (!order.getUserId().equals(buyer.getId())) {
            throw new BusinessException("Ban khong co quyen huy don hang nay.");
        }
        if (!"pending".equals(order.getStatus()) && !"confirmed".equals(order.getStatus())) {
            throw new BusinessException("Chi co the huy don hang o trang thai cho xac nhan hoac da xac nhan.");
        }

        restoreStock(order);
        order.setStatus("cancelled");
        Order saved = orderRepository.save(order);

        // Gui email thong bao huy don hang cho buyer
        emailNotificationService.sendOrderCancelledToBuyer(buyer, saved);

        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse confirmOrder(String email, UUID orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Don hang", orderId));

        if (!canConfirmOrder(user, order)) {
            throw new BusinessException("Ban khong co quyen xac nhan don hang nay.");
        }

        if (!"pending".equals(order.getStatus())) {
            throw new BusinessException("Chi co the xac nhan don hang o trang thai pending.");
        }

        order.setStatus("confirmed");
        Order saved = orderRepository.save(order);

        // Gui email xac nhan don hang cho buyer
        userRepository.findById(order.getUserId()).ifPresent(buyer ->
                emailNotificationService.sendOrderConfirmedToBuyer(buyer, saved));

        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse confirmPaymentManually(String email, UUID orderId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Don hang", orderId));

        if (!canConfirmOrder(user, order)) {
            throw new BusinessException("Ban khong co quyen xac nhan thanh toan don hang nay.");
        }
        if (!"processing".equals(order.getPaymentStatus())) {
            throw new BusinessException("Chi co the xac nhan don hang dang cho xac nhan thanh toan.");
        }
        if ("cancelled".equals(order.getStatus())) {
            throw new BusinessException("Don hang da bi huy, khong the xac nhan thanh toan.");
        }

        order.setPaymentStatus("paid");
        order.setPaymentExpiresAt(null);
        return OrderResponse.from(orderRepository.save(order));
    }

    private boolean canConfirmOrder(User user, Order order) {
        if ("admin".equalsIgnoreCase(user.getRole())) {
            return true;
        }

        Shop sellerShop = shopRepository.findByOwnerId(user.getId()).orElse(null);
        if (sellerShop == null || order.getItems() == null || order.getItems().isEmpty()) {
            return false;
        }

        return order.getItems().stream().allMatch(item ->
                productRepository.findById(item.getProductId())
                        .map(product -> product.getShopId().equals(sellerShop.getId()))
                        .orElse(false));
    }

    @Transactional
    public OrderResponse confirmPaymentFromWebhook(PaymentWebhookRequest request) {
        if (request == null || request.getOrderId() == null) {
            throw new BusinessException("Thong tin webhook thanh toan khong hop le.");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Don hang", request.getOrderId()));

        if ("cancelled".equals(order.getStatus())) {
            throw new BusinessException("Don hang da bi huy, khong the xac nhan thanh toan.");
        }
        if (request.getAmount() != null && request.getAmount().compareTo(order.getTotalAmount()) < 0) {
            throw new BusinessException("So tien thanh toan khong du.");
        }
        if (request.getStatus() != null && !"success".equalsIgnoreCase(request.getStatus()) && !"paid".equalsIgnoreCase(request.getStatus())) {
            throw new BusinessException("Trang thai thanh toan tu gateway chua thanh cong.");
        }

        order.setPaymentStatus("paid");
        order.setPaymentExpiresAt(null);
        return OrderResponse.from(orderRepository.save(order));
    }

    private void restoreStock(Order order) {
        if (order.getItems() == null) return;
        order.getItems().forEach(item -> productRepository.findById(item.getProductId()).ifPresent(product -> {
            int currentStock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
            product.setStockQuantity(currentStock + item.getQuantity());
            if (product.getStockQuantity() > 0) {
                product.setIsActive(true);
            }
            productRepository.save(product);
        }));
    }
}
