package com.smartcart.service;

import com.smartcart.dto.request.CategoryRequest;
import com.smartcart.dto.response.CategoryResponse;
import com.smartcart.dto.response.ProductResponse;
import com.smartcart.entity.Category;
import com.smartcart.exception.ResourceNotFoundException;
import com.smartcart.repository.CategoryRepository;
import com.smartcart.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findByParentIsNullOrderByDisplayOrderAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    public List<CategoryResponse> getAllCategoriesForAdmin() {
        return categoryRepository.findAllByOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    public CategoryResponse getCategoryById(UUID id) {
        return categoryRepository.findById(id)
                .map(CategoryResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Danh muc", id));
    }

    public List<ProductResponse> getProductsByCategory(UUID categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Danh muc", categoryId);
        }
        return productRepository.findPublicProductsByCategoryId(categoryId)
                .stream()
                .map(ProductResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        Category parent = resolveParent(request.getParentId());
        String slug = uniqueSlug(normalizeSlug(request.getSlug() == null || request.getSlug().isBlank() ? request.getName() : request.getSlug()), null);

        Category category = Category.builder()
                .name(request.getName().trim())
                .slug(slug)
                .imageUrl(blankToNull(request.getImageUrl()))
                .displayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder())
                .parent(parent)
                .build();

        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh muc", id));
        Category parent = resolveParent(request.getParentId());
        if (parent != null && parent.getId().equals(id)) {
            throw new RuntimeException("Danh mục cha không được trùng với chính danh mục hiện tại.");
        }

        String desiredSlug = request.getSlug() == null || request.getSlug().isBlank() ? request.getName() : request.getSlug();
        category.setName(request.getName().trim());
        category.setSlug(uniqueSlug(normalizeSlug(desiredSlug), id));
        category.setImageUrl(blankToNull(request.getImageUrl()));
        category.setDisplayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder());
        category.setParent(parent);

        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh muc", id));
        if (productRepository.countByCategoryId(id) > 0) {
            throw new RuntimeException("Không thể xóa danh mục đang có sản phẩm.");
        }
        categoryRepository.delete(category);
    }

    private Category resolveParent(UUID parentId) {
        if (parentId == null) return null;
        return categoryRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Danh muc cha", parentId));
    }

    private String uniqueSlug(String baseSlug, UUID currentId) {
        String cleanBase = baseSlug == null || baseSlug.isBlank() ? "danh-muc" : baseSlug;
        String candidate = cleanBase;
        int suffix = 2;
        while (true) {
            var existing = categoryRepository.findBySlug(candidate);
            if (existing.isEmpty() || existing.get().getId().equals(currentId)) {
                return candidate;
            }
            candidate = cleanBase + "-" + suffix++;
        }
    }

    private String normalizeSlug(String input) {
        String normalized = Normalizer.normalize(input == null ? "" : input, Normalizer.Form.NFD);
        String withoutMarks = Pattern.compile("\\p{InCombiningDiacriticalMarks}+").matcher(normalized).replaceAll("");
        return withoutMarks
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
