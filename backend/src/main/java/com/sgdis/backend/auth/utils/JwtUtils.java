package com.sgdis.backend.auth.utils;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.Claim;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtUtils {

    @Value("${jwt.secret.password}")
    private String secretPassword;

    @Value("${jwt.issuer.generator}")
    private String userGenerator;

    private Algorithm getAlgorithm() {
        return Algorithm.HMAC256(secretPassword);
    }

    public String createToken(Authentication authentication) {
        Long id = (Long) authentication.getPrincipal();
        String role = authentication.getAuthorities()
                .stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("ROLE_USER");


        return JWT.create()
                .withClaim("userId", id)
                .withJWTId(UUID.randomUUID().toString())
                .withClaim("role", role)
                .withIssuer(userGenerator)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + (1000*30))) // 30 segundos para testing
                .sign(getAlgorithm());
    }

    public String createRefreshToken(Authentication authentication) {
        Long id = (Long) authentication.getPrincipal();
        String role = authentication.getAuthorities()
                .stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("ROLE_USER");

        return JWT.create()
                .withClaim("userId", id)
                .withJWTId(UUID.randomUUID().toString())
                .withClaim("role", role)
                .withIssuer(userGenerator)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + (1000*60*60*24*7)))
                .sign(getAlgorithm());
    }

    public DecodedJWT verifyToken(String token) {
        JWTVerifier verifier = JWT.require(getAlgorithm())
                .withIssuer(userGenerator)
                .build();

        return verifier.verify(token);
    }

    public Map<String, Claim> extractAllClaims(DecodedJWT decodedJWT){
        return decodedJWT.getClaims();
    }


    public Claim extractSpecificClaim(DecodedJWT decodedJWT, String claimName){
        return decodedJWT.getClaim(claimName);
    }
}

