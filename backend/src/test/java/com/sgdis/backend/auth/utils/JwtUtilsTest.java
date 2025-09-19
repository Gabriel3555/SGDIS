package com.sgdis.backend.auth.utils;

import com.auth0.jwt.interfaces.DecodedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "secretPassword", "test-secret-key-for-jwt-utils");
        ReflectionTestUtils.setField(jwtUtils, "userGenerator", "test-issuer");
    }

    @Test
    void createToken_ShouldReturnValidToken() {
        // Given
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                1L,
                null,
                Set.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        // When
        String token = jwtUtils.createToken(authentication);

        // Then
        assertNotNull(token);
        assertTrue(token.startsWith("eyJ")); // JWT tokens start with "eyJ"

        DecodedJWT decodedJWT = jwtUtils.verifyToken(token);
        assertEquals(1L, decodedJWT.getClaim("userId").asLong());
        assertEquals("ROLE_USER", decodedJWT.getClaim("role").asString());
        assertEquals("test-issuer", decodedJWT.getIssuer());
    }

    @Test
    void createRefreshToken_ShouldReturnValidRefreshToken() {
        // Given
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                2L,
                null,
                Set.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        // When
        String refreshToken = jwtUtils.createRefreshToken(authentication);

        // Then
        assertNotNull(refreshToken);
        assertTrue(refreshToken.startsWith("eyJ"));

        DecodedJWT decodedJWT = jwtUtils.verifyToken(refreshToken);
        assertEquals(2L, decodedJWT.getClaim("userId").asLong());
        assertEquals("ROLE_ADMIN", decodedJWT.getClaim("role").asString());
        assertEquals("test-issuer", decodedJWT.getIssuer());
    }

    @Test
    void verifyToken_WithValidToken_ShouldReturnDecodedJWT() {
        // Given
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                3L,
                null,
                Set.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        String token = jwtUtils.createToken(authentication);

        // When
        DecodedJWT decodedJWT = jwtUtils.verifyToken(token);

        // Then
        assertNotNull(decodedJWT);
        assertEquals(3L, decodedJWT.getClaim("userId").asLong());
        assertEquals("ROLE_USER", decodedJWT.getClaim("role").asString());
    }

    @Test
    void verifyToken_WithInvalidToken_ShouldThrowException() {
        // Given
        String invalidToken = "invalid.jwt.token";

        // When & Then
        assertThrows(Exception.class, () -> jwtUtils.verifyToken(invalidToken));
    }

    @Test
    void extractAllClaims_ShouldReturnAllClaims() {
        // Given
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                4L,
                null,
                Set.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        String token = jwtUtils.createToken(authentication);
        DecodedJWT decodedJWT = jwtUtils.verifyToken(token);

        // When
        var claims = jwtUtils.extractAllClaims(decodedJWT);

        // Then
        assertNotNull(claims);
        assertTrue(claims.containsKey("userId"));
        assertTrue(claims.containsKey("role"));
        assertTrue(claims.containsKey("iss"));
        assertEquals(4L, claims.get("userId").asLong());
        assertEquals("ROLE_USER", claims.get("role").asString());
    }

    @Test
    void extractSpecificClaim_ShouldReturnSpecificClaim() {
        // Given
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                5L,
                null,
                Set.of(new SimpleGrantedAuthority("ROLE_MODERATOR"))
        );
        String token = jwtUtils.createToken(authentication);
        DecodedJWT decodedJWT = jwtUtils.verifyToken(token);

        // When
        var roleClaim = jwtUtils.extractSpecificClaim(decodedJWT, "role");

        // Then
        assertNotNull(roleClaim);
        assertEquals("ROLE_MODERATOR", roleClaim.asString());
    }

    @Test
    void extractSpecificClaim_WithNonExistentClaim_ShouldReturnNull() {
        // Given
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                6L,
                null,
                Set.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        String token = jwtUtils.createToken(authentication);
        DecodedJWT decodedJWT = jwtUtils.verifyToken(token);

        // When
        var nonExistentClaim = jwtUtils.extractSpecificClaim(decodedJWT, "nonExistent");

        // Then
        assertNull(nonExistentClaim.asString());
    }
}