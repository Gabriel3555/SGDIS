package com.sgdis.backend.auth.application.service;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.sgdis.backend.auth.application.dto.AuthRequest;
import com.sgdis.backend.auth.application.dto.AuthResponse;
import com.sgdis.backend.auth.application.dto.RefreshTokenRequest;
import com.sgdis.backend.auth.application.dto.RefreshTokenResponse;
import com.sgdis.backend.auth.application.port.AuthenticateUseCase;
import com.sgdis.backend.auth.application.port.LoginUseCase;
import com.sgdis.backend.auth.application.port.RefreshTokenUseCase;
import com.sgdis.backend.auth.application.port.SearchUsernameUseCase;
import com.sgdis.backend.auth.utils.JwtUtils;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.JpaUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImp implements LoginUseCase, AuthenticateUseCase, SearchUsernameUseCase, RefreshTokenUseCase, UserDetailsService {

    private final JpaUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Override
    public AuthResponse login(AuthRequest authLoginRequest) {
        String username = authLoginRequest.username();
        String password = authLoginRequest.password();

        User userEntity = userRepository.findUserByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("user not found!"));

        if (!userEntity.getStatus()) {
            throw new BadCredentialsException("Invalid username or password!");
        }

        Long id = userEntity.getId();

        Authentication authentication = this.authenticate(id, password);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwtToken = jwtUtils.createToken(authentication);
        String refreshToken = jwtUtils.createRefreshToken(authentication);

        return new AuthResponse(userEntity.getId(), username, "logged successfully!", jwtToken, refreshToken,true);
    }

    @Override
    public Authentication authenticate(Long id, String password) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BadCredentialsException("Invalid user"));
        UserDetails userDetails = this.searchUserDetails(user.getUsername());

        if (userDetails == null) {
            throw new BadCredentialsException("Invalid username or password");
        }

        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new BadCredentialsException("invalid password");
        }

        return new UsernamePasswordAuthenticationToken(id, null, userDetails.getAuthorities());
    }

    @Override
    public UserDetails searchUserDetails(String username) {
        UserEntity userEntity = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException("user not found"));

        GrantedAuthority role = new SimpleGrantedAuthority("ROLE_".concat(userEntity.getRole()));

        return new org.springframework.security.core.userdetails.User(username, userEntity.getPassword(), Set.of(role));
    }

    @Override
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        try {
            DecodedJWT decodedJWT = jwtUtils.verifyToken(request.refreshToken());
            Long userId = decodedJWT.getClaim("userId").asLong();

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UsernameNotFoundException("user not found"));

            if (!user.getStatus()) {
                throw new BadCredentialsException("Invalid username or password!");
            }

            GrantedAuthority role = new SimpleGrantedAuthority("ROLE_".concat(user.getRole()));

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    user.getId(), null, Set.of(role)
            );

            String newAccessToken = jwtUtils.createToken(authentication);

            return new RefreshTokenResponse(newAccessToken);

        } catch (Exception e) {
            throw new BadCredentialsException("Refresh token inválido o expirado");
        }
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
            return null;
    }
}
