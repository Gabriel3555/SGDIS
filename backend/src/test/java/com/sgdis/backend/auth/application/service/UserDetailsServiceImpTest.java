package com.sgdis.backend.auth.application.service;

import com.sgdis.backend.auth.config.TestConfig;
import com.sgdis.backend.auth.application.dto.AuthRequest;
import com.sgdis.backend.auth.application.dto.AuthResponse;
import com.sgdis.backend.auth.application.dto.RefreshTokenRequest;
import com.sgdis.backend.auth.application.dto.RefreshTokenResponse;
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
        userDetailsServiceImp = new UserDetailsServiceImp(userRepository, springDataUserRepository, passwordEncoder, jwtUtils);

        // Create test user using repository
        String encodedPassword = passwordEncoder.encode("password123");
        UserEntity userEntity = new UserEntity(null, "testuser", encodedPassword, "test@example.com", Role.USER, true);
        springDataUserRepository.save(userEntity);

        testUser = new User(1L, "testuser", encodedPassword, "test@example.com", Role.USER, true);
        authRequest = new AuthRequest("testuser", "password123");
    }

    @Test
    @Transactional
    void login_WithValidCredentials_ShouldReturnAuthResponse() {
        // When
        AuthResponse response = userDetailsServiceImp.login(authRequest);

        // Then
        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals("testuser", response.username());
        assertEquals("logged successfully!", response.message());
        assertNotNull(response.jwt());
        assertNotNull(response.refreshToken());
        assertTrue(response.status());
    }

    @Test
    void login_WithInactiveUser_ShouldThrowBadCredentialsException() {
        // Given - Create inactive user
        String encodedPassword = passwordEncoder.encode("password123");
        UserEntity inactiveUserEntity = new UserEntity(null, "inactiveuser", encodedPassword, "inactive@example.com", Role.USER, false);
        entityManager.persist(inactiveUserEntity);
        entityManager.flush();

        AuthRequest inactiveRequest = new AuthRequest("inactiveuser", "password123");

        // When & Then
        Exception exception = assertThrows(Exception.class,
                () -> userDetailsServiceImp.login(inactiveRequest));
        assertTrue(exception.getMessage().contains("Invalid username or password"));
    }

    @Test
    void login_WithInvalidPassword_ShouldThrowBadCredentialsException() {
        // Given
        AuthRequest invalidRequest = new AuthRequest("testuser", "wrongpassword");

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
    void searchUserDetails_WithValidUsername_ShouldReturnUserDetails() {
        // When
        var userDetails = userDetailsServiceImp.searchUserDetails("testuser");

        // Then
        assertNotNull(userDetails);
        assertEquals("testuser", userDetails.getUsername());
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
        // When
        var userDetails = userDetailsServiceImp.loadUserByUsername("testuser");

        // Then
        assertNotNull(userDetails);
        assertEquals("testuser", userDetails.getUsername());
    }
}