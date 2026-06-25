package com.smartcart.service;

import com.smartcart.dto.request.CartItemRequest;
import com.smartcart.dto.response.CartResponse;
import com.smartcart.entity.Cart;
import com.smartcart.entity.CartItem;
import com.smartcart.entity.Product;
import com.smartcart.entity.User;
import com.smartcart.exception.BusinessException;
import com.smartcart.exception.ResourceNotFoundException;
import com.smartcart.repository.CartItemRepository;
import com.smartcart.repository.CartRepository;
import com.smartcart.repository.ProductRepository;
import com.smartcart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                       ProductRepository productRepository, UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    // Lay hoac tu dong tao gio hang cho user
    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user).orElseGet(() -> {
            Cart newCart = Cart.builder()
                    .user(user)
                    .items(new ArrayList<>())
                    .build();
            return cartRepository.save(newCart);
        });
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
    }

    public CartResponse getCart(String email) {
        User user = getUser(email);
        Cart cart = getOrCreateCart(user);
        return CartResponse.from(cart);
    }

    @Transactional
    public CartResponse addItem(String email, CartItemRequest request) {
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new BusinessException("So luong phai lon hon 0.");
        }

        User user = getUser(email);
        Cart cart = getOrCreateCart(user);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("San pham", request.getProductId()));

        if (!product.getIsActive()) {
            throw new BusinessException("San pham nay hien khong con ban.");
        }

        // Neu san pham da co trong gio -> cong don so luong
        CartItem existingItem = cartItemRepository.findByCartAndProduct(cart, product).orElse(null);
        int requestedQuantity = request.getQuantity() + (existingItem == null ? 0 : existingItem.getQuantity());
        validateStock(product, requestedQuantity);
        if (existingItem != null) {
            existingItem.setQuantity(requestedQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            CartItem savedItem = cartItemRepository.save(newItem);
            cart.getItems().add(savedItem);
        }

        return CartResponse.from(cart);
    }

    @Transactional
    public CartResponse updateItem(String email, UUID itemId, CartItemRequest request) {
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new BusinessException("So luong phai lon hon 0.");
        }

        User user = getUser(email);
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item", itemId));

        // Kiem tra item co thuoc gio cua user nay khong
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BusinessException("Ban khong co quyen chinh sua item nay.");
        }

        validateStock(item.getProduct(), request.getQuantity());
        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        Cart updatedCart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Gio hang khong ton tai."));
        return CartResponse.from(updatedCart);
    }

    @Transactional
    public CartResponse removeItem(String email, UUID itemId) {
        User user = getUser(email);
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item", itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BusinessException("Ban khong co quyen xoa item nay.");
        }

        if (cart.getItems() != null) {
            cart.getItems().removeIf(cartItem -> cartItem.getId().equals(itemId));
        }
        cartItemRepository.delete(item);

        return CartResponse.from(cart);
    }

    @Transactional
    public void clearCart(String email) {
        User user = getUser(email);
        Cart cart = getOrCreateCart(user);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private void validateStock(Product product, int requestedQuantity) {
        int stockQuantity = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
        if (stockQuantity < requestedQuantity) {
            throw new BusinessException("San pham '" + product.getName() + "' chi con " + stockQuantity + " san pham trong kho.");
        }
    }
}
