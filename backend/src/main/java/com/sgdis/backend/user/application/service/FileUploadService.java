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
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = "profile" + extension;
        Path userDir = rootLocation.resolve(email);
        Files.createDirectories(userDir);
        Path targetFile = userDir.resolve(filename);
        Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/" + email + "/" + filename;
    }

    public void deleteFile(String imgUrl) throws IOException {
        if (imgUrl != null) {
            Path filePath = Paths.get("uploads" + imgUrl.substring(8));
            Files.deleteIfExists(filePath);
        }
    }
}