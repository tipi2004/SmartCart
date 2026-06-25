package com.smartcart.service;

import com.smartcart.dto.response.OrderResponse;
import com.smartcart.dto.response.ProductResponse;
import com.smartcart.dto.response.ShopResponse;
import com.smartcart.dto.response.UserResponse;
import com.smartcart.entity.Order;
import com.smartcart.entity.Product;
import com.smartcart.entity.Shop;
import com.smartcart.entity.User;
import com.smartcart.exception.ResourceNotFoundException;
import com.smartcart.repository.OrderRepository;
import com.smartcart.repository.ProductRepository;
import com.smartcart.repository.ShopRepository;
import com.smartcart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ShopRepository shopRepository;

    public AdminService(UserRepository userRepository, ProductRepository productRepository,
                        OrderRepository orderRepository, ShopRepository shopRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.shopRepository = shopRepository;
    }

    // ========== USER MANAGEMENT ==========

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse updateUserStatus(UUID userId, Boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Nguoi dung", userId));
        user.setIsActive(isActive);
        return UserResponse.from(userRepository.save(user));
    }

    // ========== PRODUCT MANAGEMENT ==========

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(ProductResponse::from)
                .toList();
    }

    @Transactional
    public ProductResponse updateProductStatus(UUID productId, Boolean isActive) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("San pham", productId));
        product.setIsActive(isActive);
        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProductApprovalStatus(UUID productId, String approvalStatus, String rejectionReason) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("San pham", productId));
        String normalizedStatus = approvalStatus == null ? "" : approvalStatus.trim().toLowerCase();
        if (!List.of("pending", "approved", "rejected").contains(normalizedStatus)) {
            throw new IllegalArgumentException("Trang thai duyet san pham khong hop le.");
        }
        if ("rejected".equals(normalizedStatus) && (rejectionReason == null || rejectionReason.isBlank())) {
            throw new IllegalArgumentException("Vui long nhap ly do tu choi san pham.");
        }
        product.setApprovalStatus(normalizedStatus);
        if ("approved".equals(normalizedStatus)) {
            product.setIsActive(true);
            product.setRejectionReason(null);
        } else if ("pending".equals(normalizedStatus)) {
            product.setRejectionReason(null);
        } else {
            product.setRejectionReason(rejectionReason.trim());
        }
        return ProductResponse.from(productRepository.save(product));
    }

    // ========== SHOP MANAGEMENT ==========

    public List<ShopResponse> getAllShops() {
        return shopRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(shop -> ShopResponse.from(shop, userRepository.findById(shop.getOwnerId()).orElse(null)))
                .toList();
    }

    @Transactional
    public ShopResponse updateShopStatus(UUID shopId, String status) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", shopId));
        String normalizedStatus = status == null ? "" : status.trim().toLowerCase();
        if (!List.of("pending", "active", "suspended").contains(normalizedStatus)) {
            throw new IllegalArgumentException("Trang thai shop khong hop le.");
        }
        shop.setStatus(normalizedStatus);
        shop.setIsVerified("active".equals(normalizedStatus));
        Shop savedShop = shopRepository.save(shop);
        return ShopResponse.from(savedShop, userRepository.findById(savedShop.getOwnerId()).orElse(null));
    }

    // ========== ORDER MANAGEMENT ==========

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(OrderResponse::from)
                .toList();
    }

    public OrderResponse getOrderById(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Don hang", orderId));
        return OrderResponse.from(order);
    }
}
