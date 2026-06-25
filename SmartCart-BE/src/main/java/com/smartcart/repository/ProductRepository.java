package com.smartcart.repository;

import com.smartcart.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    List<Product> findByIsActiveTrueOrderByCreatedAtDesc();

    @Query("""
            select p from Product p
            where p.isActive = true
              and (p.approvalStatus = 'approved' or p.approvalStatus is null)
              and exists (select 1 from Shop s where s.id = p.shopId and s.status = 'active')
            order by p.createdAt desc
            """)
    List<Product> findPublicProducts();

    @Query("""
            select p from Product p
            where p.category.id = :categoryId
              and p.isActive = true
              and (p.approvalStatus = 'approved' or p.approvalStatus is null)
              and exists (select 1 from Shop s where s.id = p.shopId and s.status = 'active')
            order by p.createdAt desc
            """)
    List<Product> findPublicProductsByCategoryId(@Param("categoryId") UUID categoryId);

    @Query("""
            select p from Product p
            where p.shopId = :shopId
              and p.isActive = true
              and (p.approvalStatus = 'approved' or p.approvalStatus is null)
              and exists (select 1 from Shop s where s.id = p.shopId and s.status = 'active')
            order by p.createdAt desc
            """)
    List<Product> findPublicProductsByShopId(@Param("shopId") UUID shopId);

    Optional<Product> findByIdAndIsActiveTrue(UUID id);

    List<Product> findByCategoryIdAndIsActiveTrueOrderByCreatedAtDesc(UUID categoryId);

    List<Product> findByShopIdAndIsActiveTrueOrderByCreatedAtDesc(UUID shopId);

    List<Product> findByShopIdOrderByCreatedAtDesc(UUID shopId);

    long countByCategoryId(UUID categoryId);
}
