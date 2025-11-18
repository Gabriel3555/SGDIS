package com.sgdis.backend.user.application.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileUploadService {

    private final Path rootLocation = Paths.get("uploads");

    public FileUploadService() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create uploads directory", e);
        }
    }

    public String saveFile(MultipartFile file, String email) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("File name cannot be null or empty");
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = "profile" + extension;
        Path userDir = rootLocation.resolve(email);
        Files.createDirectories(userDir);
        Path targetFile = userDir.resolve(filename);
        Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/" + email + "/" + filename;
    }

    public void deleteFile(String imgUrl) throws IOException {
        if (imgUrl != null && imgUrl.startsWith("/uploads/")) {
            // Remove the leading "/uploads/" to get the relative path
            String relativePath = imgUrl.substring(8);
            Path filePath = rootLocation.resolve(relativePath);
            Files.deleteIfExists(filePath);
            
            // Try to delete the parent directory if it's empty (for inventories)
            Path parentDir = filePath.getParent();
            if (parentDir != null && Files.exists(parentDir)) {
                try {
                    Files.deleteIfExists(parentDir);
                } catch (Exception e) {
                    // Ignore if directory is not empty
                }
            }
        }
    }

    public String saveInventoryFile(MultipartFile file, String inventoryUuid) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("File name cannot be null or empty");
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = "inventory" + extension;
        Path inventoryDir = rootLocation.resolve("inventories").resolve(inventoryUuid);
        Files.createDirectories(inventoryDir);
        Path targetFile = inventoryDir.resolve(filename);
        Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/inventories/" + inventoryUuid + "/" + filename;
    }

    public String saveLoanDocument(MultipartFile file, Long loanId) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("File name cannot be null or empty");
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = "document" + extension;
        Path loanDir = rootLocation.resolve("loans").resolve(loanId.toString());
        Files.createDirectories(loanDir);
        Path targetFile = loanDir.resolve(filename);
        Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/loans/" + loanId + "/" + filename;
    }

    public String saveItemImage(MultipartFile file, Long itemId, int imageIndex) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("File name cannot be null or empty");
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = "image_" + imageIndex + extension;
        Path itemDir = rootLocation.resolve("items").resolve(itemId.toString());
        Files.createDirectories(itemDir);
        Path targetFile = itemDir.resolve(filename);
        Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/items/" + itemId + "/" + filename;
    }
}