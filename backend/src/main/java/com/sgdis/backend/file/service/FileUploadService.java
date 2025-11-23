package com.sgdis.backend.file.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

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
        Path userDir = rootLocation.resolve("users").resolve(email);
        Files.createDirectories(userDir);
        Path targetFile = userDir.resolve(filename);
        Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/" + email + "/" + filename;
    }

    public void deleteFile(String imgUrl) throws IOException {
        if (imgUrl != null && imgUrl.startsWith("/uploads/")) {
            String relativePath = imgUrl.substring(8);
            Path filePath = rootLocation.resolve(relativePath);
            Files.deleteIfExists(filePath);

            Path parentDir = filePath.getParent();
            if (parentDir != null && Files.exists(parentDir)) {
                try {
                    Files.deleteIfExists(parentDir);
                } catch (Exception e) {
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

    public String saveVerificationFile(MultipartFile file, String licencePlateNumber, Long verificationId, int fileIndex) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("File name cannot be null or empty");
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = "verification_" + verificationId + "_" + fileIndex + extension;

        Path verificationDir = rootLocation.resolve("verifications").resolve(licencePlateNumber);
        Files.createDirectories(verificationDir);
        
        Path targetFile = verificationDir.resolve(filename);
        Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/verifications/" + licencePlateNumber + "/" + filename;
    }

    public String saveCancellationFormatFile(MultipartFile file, UUID uuid) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("File name cannot be null or empty");
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = "cancellation_" + uuid.toString() + extension;
        Path cancellationDir = rootLocation.resolve("cancellation");
        Files.createDirectories(cancellationDir);
        Path targetFile = cancellationDir.resolve(filename);
        Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/cancellation/" + filename;
    }

    public String saveCancellationFormatExampleFile(MultipartFile file, UUID uuid) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("File name cannot be null or empty");
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = "cancellation_example_" + uuid.toString() + extension;
        Path cancellationDir = rootLocation.resolve("cancellation");
        Files.createDirectories(cancellationDir);
        Path targetFile = cancellationDir.resolve(filename);
        Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/cancellation/" + filename;
    }
}