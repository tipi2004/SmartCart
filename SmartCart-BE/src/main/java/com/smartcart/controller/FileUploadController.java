package com.smartcart.controller;

import com.smartcart.dto.ApiResponse;
import com.smartcart.exception.BusinessException;
import com.smartcart.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@Tag(name = "4. Upload (Tai file)", description = "API tai anh san pham len Cloudinary")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    public FileUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @Operation(summary = "Tai anh len Cloudinary")
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = fileUploadService.uploadFile(file);
            return ResponseEntity.ok(ApiResponse.success("Upload thanh cong.", imageUrl));
        } catch (Exception e) {
            throw new BusinessException("Loi upload anh: " + e.getMessage());
        }
    }
}