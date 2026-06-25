package com.smartcart.repository;

import com.smartcart.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    
    // Thêm hàm này để tìm bằng số điện thoại
    Optional<User> findByPhone(String phone); 
}