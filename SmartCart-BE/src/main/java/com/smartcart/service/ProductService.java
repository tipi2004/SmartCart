package com.smartcart.service;

import com.smartcart.dto.ProductRequest;
import com.smartcart.dto.request.UpdateProductRequest;
import com.smartcart.dto.response.ProductResponse;
import com.smartcart.entity.Category;
import com.smartcart.entity.Product;
import com.smartcart.entity.Shop;
import com.smartcart.entity.User;
import com.smartcart.exception.BusinessException;
import com.smartcart.exception.ResourceNotFoundException;
import com.smartcart.repository.CategoryRepository;
import com.smartcart.repository.ProductRepository;
import com.smartcart.repository.ShopRepository;
import com.smartcart.repository.UserRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, UserRepository userRepository,
                          ShopRepository shopRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<ProductResponse> getAllActiveProducts() {
        return productRepository.findPublicProducts()
                .stream().map(ProductResponse::from).toList();
    }

    public ProductResponse getProductById(UUID id) {
        Product product = productRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("San pham", id));
        if (!isApprovedProduct(product) || !shopRepository.existsByIdAndStatus(product.getShopId(), "active")) {
            throw new ResourceNotFoundException("San pham", id);
        }
        return ProductResponse.from(product);
    }

    public List<ProductResponse> searchProducts(UUID categoryId, String keyword) {
        Specification<Product> spec = Specification.where(isActive()).and(isApproved());
        if (categoryId != null) spec = spec.and(hasCategory(categoryId));
        if (keyword != null && !keyword.isBlank()) spec = spec.and(nameOrDescContains(keyword));
        return productRepository.findAll(spec.and(orderByCreatedAtDesc()))
                .stream().map(ProductResponse::from).toList();
    }

    public String createProduct(ProductRequest request, String imageUrl, String email) {
        validateProductRequest(request);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung!"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Danh muc khong ton tai!"));

        Shop shop = shopRepository.findByOwnerId(user.getId()).orElseGet(() -> {
            Shop newShop = Shop.builder()
                    .ownerId(user.getId())
                    .name("Goc pass do cua " + user.getFullName())
                    .slug(generateSlug("shop-" + user.getFullName() + "-" + UUID.randomUUID().toString().substring(0, 5)))
                    .status("pending")
                    .isVerified(false)
                    .build();
            return shopRepository.save(newShop);
        });
        ensureShopCanManageProducts(shop);

        Product newProduct = Product.builder()
                .shopId(shop.getId())
                .category(category)
                .name(request.getName())
                .slug(generateSlug(request.getName() + "-" + UUID.randomUUID().toString().substring(0, 5)))
                .description(request.getDescription())
                .basePrice(request.getPrice())
                .stockQuantity(request.getStockQuantity() == null ? 100 : request.getStockQuantity())
                .imageUrl(imageUrl)
                .isActive(true)
                .approvalStatus("pending")
                .rejectionReason(null)
                .build();

        productRepository.save(newProduct);
        return "Dang ban thanh cong mon: " + request.getName() + " vao " + shop.getName();
    }

    @Transactional
    public ProductResponse updateProduct(UUID productId, UpdateProductRequest request, String email) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("San pham", productId));

        // Kiem tra quyen: chi chu shop moi duoc sua
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung!"));
        Shop shop = shopRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new BusinessException("Ban chua co shop."));
        if (!product.getShopId().equals(shop.getId())) {
            throw new BusinessException("Ban khong co quyen chinh sua san pham nay.");
        }
        ensureShopCanManageProducts(shop);

        if (request.getName() != null && !request.getName().isBlank()) {
            product.setName(request.getName());
            product.setSlug(generateSlug(request.getName() + "-" + UUID.randomUUID().toString().substring(0, 5)));
        }
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null) {
            if (request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("Gia san pham phai lon hon 0.");
            }
            product.setBasePrice(request.getPrice());
        }
        if (request.getStockQuantity() != null) {
            if (request.getStockQuantity() < 0) {
                throw new BusinessException("So luong ton kho khong duoc am.");
            }
            product.setStockQuantity(request.getStockQuantity());
            if (request.getStockQuantity() > 0) {
                product.setIsActive(true);
            }
        }
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh muc khong ton tai!"));
            product.setCategory(category);
        }
        product.setApprovalStatus("pending");
        product.setRejectionReason(null);

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(UUID productId, String email) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("San pham", productId));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung!"));
        Shop shop = shopRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new BusinessException("Ban chua co shop."));
        if (!product.getShopId().equals(shop.getId())) {
            throw new BusinessException("Ban khong co quyen xoa san pham nay.");
        }

        product.setIsActive(false);
        productRepository.save(product);
    }

    // --- Specifications ---

    private Specification<Product> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("isActive"));
    }

    private Specification<Product> isApproved() {
        return (root, query, cb) -> cb.or(
                cb.equal(root.get("approvalStatus"), "approved"),
                cb.isNull(root.get("approvalStatus"))
        );
    }

    private boolean isApprovedProduct(Product product) {
        return product.getApprovalStatus() == null || "approved".equals(product.getApprovalStatus());
    }

    private Specification<Product> hasCategory(UUID categoryId) {
        return (root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId);
    }

    private Specification<Product> nameOrDescContains(String keyword) {
        return (root, query, cb) -> {
            String pattern = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("name")), pattern),
                cb.like(cb.lower(root.get("description")), pattern)
            );
        };
    }

    private Specification<Product> orderByCreatedAtDesc() {
        return (root, query, cb) -> {
            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.conjunction();
        };
    }

    private void validateProductRequest(ProductRequest request) {
        if (request == null) {
            throw new BusinessException("Du lieu san pham khong duoc de trong.");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BusinessException("Ten san pham khong duoc de trong.");
        }
        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Gia san pham phai lon hon 0.");
        }
        if (request.getCategoryId() == null) {
            throw new BusinessException("Danh muc khong duoc de trong.");
        }
        if (request.getStockQuantity() != null && request.getStockQuantity() < 0) {
            throw new BusinessException("So luong ton kho khong duoc am.");
        }
    }

    private void ensureShopCanManageProducts(Shop shop) {
        if (shop != null && "suspended".equals(shop.getStatus())) {
            throw new BusinessException("Shop dang bi khoa, khong the dang hoac chinh sua san pham.");
        }
    }

    private String generateSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String noAccents = pattern.matcher(normalized).replaceAll("");
        return noAccents.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
