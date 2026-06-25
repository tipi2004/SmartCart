package com.smartcart.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileUploadService {

    private final Cloudinary cloudinary;
    private final Path uploadDir = Path.of("uploads", "products");

    public FileUploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File anh khong hop le.");
        }

        if (!isCloudinaryEnabled()) {
            return saveLocalFile(file);
        }

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        return uploadResult.get("secure_url").toString();
    }

    private boolean isCloudinaryEnabled() {
        return cloudinary != null
                && cloudinary.config.cloudName != null
                && !cloudinary.config.cloudName.isBlank()
                && cloudinary.config.apiKey != null
                && !cloudinary.config.apiKey.isBlank()
                && cloudinary.config.apiSecret != null
                && !cloudinary.config.apiSecret.isBlank();
    }

    private String saveLocalFile(MultipartFile file) throws IOException {
        Files.createDirectories(uploadDir);

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null) {
            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex >= 0 && dotIndex < originalName.length() - 1) {
                extension = originalName.substring(dotIndex).replaceAll("[^a-zA-Z0-9.]", "");
            }
        }

        String fileName = UUID.randomUUID() + extension;
        Path target = uploadDir.resolve(fileName).normalize();
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/products/")
                .path(fileName)
                .toUriString();
    }
}
