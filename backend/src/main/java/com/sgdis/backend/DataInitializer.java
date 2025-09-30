package com.sgdis.backend;

import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SpringDataUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create default users for testing
        createUserIfNotExists("gabriel@soy.sena.edu.co", "1234", "Gabriel", "Desarrollador", "Tecnología", Role.USER);
        createUserIfNotExists("admin@soy.sena.edu.co", "admin123", "Admin", "Administrador", "Sistemas", Role.ADMIN);
        createUserIfNotExists("warehouse@soy.sena.edu.co", "wh123", "Warehouse", "Almacenista", "Logística", Role.WAREHOUSE);
    }

    private void createUserIfNotExists(String email, String password, String fullName, String jobTitle, String laborDepartment, Role role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setFullName(fullName);
            user.setJobTitle(jobTitle);
            user.setLaborDepartment(laborDepartment);
            user.setRole(role);
            user.setStatus(true);
            user.setImgUrl(null);

            UserEntity entity = UserMapper.toEntity(user);
            userRepository.save(entity);
            System.out.println("Created default user: " + email + " with role: " + role);
        }
    }
}