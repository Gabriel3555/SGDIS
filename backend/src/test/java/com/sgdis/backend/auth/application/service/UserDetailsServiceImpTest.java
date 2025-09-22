package com.sgdis.backend.auth.application.service;

import com.sgdis.backend.auth.config.TestConfig;
import com.sgdis.backend.auth.application.dto.AuthRequest;
import com.sgdis.backend.auth.application.dto.AuthResponse;
import com.sgdis.backend.auth.application.dto.RefreshTokenRequest;
import com.sgdis.backend.auth.application.dto.RefreshTokenResponse;
import com.sgdis.backend.auth.application.dto.RegisterRequest;
import com.sgdis.backend.user.application.service.FileUploadService;
import com.sgdis.backend.auth.utils.JwtUtils;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.JpaUserRepository;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import(TestConfig.class)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class UserDetailsServiceImpTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private SpringDataUserRepository springDataUserRepository;

    private JpaUserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtUtils jwtUtils;
    private FileUploadService fileUploadService;
    private UserDetailsServiceImp userDetailsServiceImp;

    private User testUser;
    private AuthRequest authRequest;

    @BeforeEach
    void setUp() {
        userRepository = new JpaUserRepository(springDataUserRepository);
        passwordEncoder = new BCryptPasswordEncoder();
        jwtUtils = new JwtUtils();
        // Set JWT properties for testing
        ReflectionTestUtils.setField(jwtUtils, "secretPassword", "test-secret-key-for-jwt");
        ReflectionTestUtils.setField(jwtUtils, "userGenerator", "test-issuer");
        fileUploadService = new FileUploadService();
        userDetailsServiceImp = new UserDetailsServiceImp(userRepository, springDataUserRepository, passwordEncoder, jwtUtils, fileUploadService);

        // Create test user using repository
        String encodedPassword = passwordEncoder.encode("password123");
        UserEntity userEntity = new UserEntity(null, encodedPassword, "test@soy.sena.edu.co", "Test User", "Developer", "IT", null, Role.USER, true);
        springDataUserRepository.save(userEntity);

        testUser = new User(1L, encodedPassword, "test@soy.sena.edu.co", "Test User", "Developer", "IT", null, Role.USER, true);
        authRequest = new AuthRequest("test@soy.sena.edu.co", "password123");
    }

    @Test
    @Transactional
    void login_WithValidCredentials_ShouldReturnAuthResponse() {
        // When
        AuthResponse response = userDetailsServiceImp.login(authRequest);

        // Then
        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals("test@soy.sena.edu.co", response.email());
        assertEquals("logged successfully!", response.message());
        assertNotNull(response.jwt());
        assertNotNull(response.refreshToken());
        assertTrue(response.status());
    }

    @Test
    void login_WithInactiveUser_ShouldThrowBadCredentialsException() {
        String encodedPassword = passwordEncoder.encode("password123");
        UserEntity inactiveUserEntity = new UserEntity(null, encodedPassword, "inactive@soy.sena.edu.co", "Inactive User", "Tester", "QA", null, Role.USER, false);
        entityManager.persist(inactiveUserEntity);
        entityManager.flush();

        AuthRequest inactiveRequest = new AuthRequest("inactive@soy.sena.edu.co", "password123");

        Exception exception = assertThrows(Exception.class,
                () -> userDetailsServiceImp.login(inactiveRequest));
        assertTrue(exception.getMessage().contains("Invalid email or password"));
    }

    @Test
    void login_WithInvalidPassword_ShouldThrowBadCredentialsException() {
        // Given
        AuthRequest invalidRequest = new AuthRequest("test@soy.sena.edu.co", "wrongpassword");

        // When & Then
        Exception exception = assertThrows(Exception.class,
                () -> userDetailsServiceImp.login(invalidRequest));
        assertTrue(exception.getMessage().contains("invalid password"));
    }

    @Test
    void authenticate_WithValidCredentials_ShouldReturnAuthentication() {
        // When
        var authentication = userDetailsServiceImp.authenticate(1L, "password123");

        // Then
        assertNotNull(authentication);
        assertEquals(1L, authentication.getPrincipal());
        assertTrue(authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_USER")));
    }

    @Test
    void authenticate_WithInvalidPassword_ShouldThrowException() {
        // When & Then
        Exception exception = assertThrows(Exception.class,
                () -> userDetailsServiceImp.authenticate(1L, "wrongpassword"));
        assertTrue(exception.getMessage().contains("invalid password"));
    }

    @Test
    void searchUserDetails_WithValidEmail_ShouldReturnUserDetails() {
        // When
        var userDetails = userDetailsServiceImp.searchUserDetails("test@soy.sena.edu.co");

        // Then
        assertNotNull(userDetails);
        assertEquals("test@soy.sena.edu.co", userDetails.getUsername());
        assertNotNull(userDetails.getPassword());
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_USER")));
    }

    @Test
    void refreshToken_WithValidToken_ShouldReturnRefreshTokenResponse() {
        // Given - Create a valid refresh token first
        var authentication = userDetailsServiceImp.authenticate(1L, "password123");
        String refreshToken = jwtUtils.createRefreshToken(authentication);
        RefreshTokenRequest request = new RefreshTokenRequest(refreshToken);

        // When
        RefreshTokenResponse response = userDetailsServiceImp.refreshToken(request);

        // Then
        assertNotNull(response);
        assertNotNull(response.accessToken());
    }

    @Test
    void refreshToken_WithInvalidToken_ShouldThrowException() {
        // Given
        RefreshTokenRequest request = new RefreshTokenRequest("invalid-token");

        // When & Then
        Exception exception = assertThrows(Exception.class,
                () -> userDetailsServiceImp.refreshToken(request));
        assertTrue(exception.getMessage().contains("Refresh token"));
    }

    @Test
    void loadUserByUsername_ShouldDelegateToSearchUserDetails() {
        var userDetails = userDetailsServiceImp.loadUserByUsername("test@soy.sena.edu.co");

        assertNotNull(userDetails);
        assertEquals("test@soy.sena.edu.co", userDetails.getUsername());
    }

    @Test
    void register_WithValidData_ShouldCreateUser() {
        RegisterRequest request = new RegisterRequest("password123", "newuser@soy.sena.edu.co", "New User", "Developer", "IT");

        userDetailsServiceImp.register(request);

        UserEntity saved = springDataUserRepository.findByEmail("newuser@soy.sena.edu.co").orElse(null);
        assertNotNull(saved);
        assertEquals("newuser@soy.sena.edu.co", saved.getEmail());
        assertEquals("New User", saved.getFullName());
        assertEquals("Developer", saved.getJobTitle());
        assertEquals("IT", saved.getLaborDepartment());
    }

    @Test
    void register_WithInvalidEmailDomain_ShouldThrowException() {
        RegisterRequest request = new RegisterRequest("password123", "newuser@gmail.com", "New User", "Developer", "IT");

        Exception exception = assertThrows(IllegalArgumentException.class,
                () -> userDetailsServiceImp.register(request));
        assertTrue(exception.getMessage().contains("Email must be from"));
    }

    @Test
    void register_WithDuplicateEmail_ShouldThrowException() {
        RegisterRequest request = new RegisterRequest("password123", "test@soy.sena.edu.co", "Test User", "Developer", "IT");

        Exception exception = assertThrows(IllegalArgumentException.class,
                () -> userDetailsServiceImp.register(request));
        assertTrue(exception.getMessage().contains("Email already exists"));
    }
}