package com.smartcart.service;

import com.smartcart.dto.request.UpdateShopRequest;
import com.smartcart.dto.response.OrderResponse;
import com.smartcart.dto.response.ProductResponse;
import com.smartcart.dto.response.ShopResponse;
import com.smartcart.entity.Product;
import com.smartcart.entity.Shop;
import com.smartcart.entity.User;
import com.smartcart.exception.BusinessException;
import com.smartcart.exception.ResourceNotFoundException;
import com.smartcart.repository.OrderRepository;
import com.smartcart.repository.ProductRepository;
import com.smartcart.repository.ShopRepository;
import com.smartcart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Service
public class ShopService {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public ShopService(ShopRepository shopRepository, UserRepository userRepository,
                       ProductRepository productRepository, OrderRepository orderRepository) {
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    public ShopResponse getMyShop(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        Shop shop = shopRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new BusinessException("Ban chua co shop. Hay dang ban san pham dau tien de tu dong tao shop."));
        return ShopResponse.from(shop);
    }

    @Transactional
    public ShopResponse updateMyShop(String email, UpdateShopRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        Shop shop = shopRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new BusinessException("Ban chua co shop."));

        if (request.getName() != null && !request.getName().isBlank()) {
            shop.setName(request.getName());
            shop.setSlug(generateSlug(request.getName() + "-" + UUID.randomUUID().toString().substring(0, 5)));
        }

        return ShopResponse.from(shopRepository.save(shop));
    }

    public ShopResponse getShopById(UUID shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop", shopId));
        return ShopResponse.from(shop);
    }

    public List<ProductResponse> getShopProducts(UUID shopId) {
        if (!shopRepository.existsById(shopId)) {
            throw new ResourceNotFoundException("Shop", shopId);
        }
        return productRepository.findPublicProductsByShopId(shopId)
                .stream().map(ProductResponse::from).toList();
    }

    public List<ProductResponse> getMyProducts(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        Shop shop = shopRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new BusinessException("Ban chua co shop. Hay dang ban san pham dau tien de tu dong tao shop."));
        return productRepository.findByShopIdOrderByCreatedAtDesc(shop.getId())
                .stream().map(ProductResponse::from).toList();
    }

    public List<OrderResponse> getMyOrders(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
        Shop shop = shopRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new BusinessException("Ban chua co shop."));

        List<Product> products = productRepository.findByShopIdOrderByCreatedAtDesc(shop.getId());
        List<UUID> productIds = products.stream().map(Product::getId).toList();
        if (productIds.isEmpty()) {
            return List.of();
        }
        Set<UUID> productIdSet = productIds.stream().collect(Collectors.toSet());
        return orderRepository.findSellerOrdersByProductIds(productIds)
                .stream()
                .map(order -> OrderResponse.fromSeller(order, productIdSet))
                .toList();
    }

    private String generateSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String noAccents = pattern.matcher(normalized).replaceAll("");
        return noAccents.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
