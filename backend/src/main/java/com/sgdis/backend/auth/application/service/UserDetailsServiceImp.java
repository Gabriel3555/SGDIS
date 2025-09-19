package com.sgdis.backend.auth.application.service;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.sgdis.backend.auth.application.dto.AuthRequest;
import com.sgdis.backend.auth.application.dto.AuthResponse;
import com.sgdis.backend.auth.application.dto.RefreshTokenRequest;
import com.sgdis.backend.auth.application.dto.RefreshTokenResponse;
import com.sgdis.backend.auth.application.dto.RegisterRequest;
import com.sgdis.backend.auth.application.port.AuthenticateUseCase;
import com.sgdis.backend.auth.application.port.LoginUseCase;
import com.sgdis.backend.auth.application.port.RefreshTokenUseCase;
import com.sgdis.backend.auth.application.port.RegisterUseCase;
import com.sgdis.backend.auth.application.port.SearchUsernameUseCase;
import com.sgdis.backend.auth.utils.JwtUtils;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.JpaUserRepository;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.user.mapper.UserMapper;
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
import org.springframework.beans.factory.annotation.Qualifier;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImp implements LoginUseCase, AuthenticateUseCase, SearchUsernameUseCase, RefreshTokenUseCase, RegisterUseCase, UserDetailsService {

    private final JpaUserRepository userRepository;
    private final SpringDataUserRepository springDataUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Override
    public AuthResponse login(AuthRequest authLoginRequest) {
        String username = authLoginRequest.username();
        String password = authLoginRequest.password();

        User user = userRepository.findUserByUsername(username);

        if (!user.isStatus()) {
            throw new BadCredentialsException("Invalid username or password!");
        }

        Authentication authentication = this.authenticate(user.getId(), password);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwtToken = jwtUtils.createToken(authentication);
        String refreshToken = jwtUtils.createRefreshToken(authentication);

        return new AuthResponse(user.getId(), username, "logged successfully!", jwtToken, refreshToken,true);
    }

    @Override
    public Authentication authenticate(Long id, String password) {
        User user = userRepository.findUserById(id);
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
        User user = userRepository.findUserByUsername(username);

        GrantedAuthority role = new SimpleGrantedAuthority("ROLE_".concat(user.getRole().name()));

        return new org.springframework.security.core.userdetails.User(username, user.getPassword(), Set.of(role));
    }

    @Override
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        try {
            DecodedJWT decodedJWT = jwtUtils.verifyToken(request.refreshToken());
            Long userId = decodedJWT.getClaim("userId").asLong();

            User user = userRepository.findUserById(userId);

            if (!user.isStatus()) {
                throw new BadCredentialsException("Invalid username or password!");
            }

            GrantedAuthority role = new SimpleGrantedAuthority("ROLE_".concat(user.getRole().name()));

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
    public void register(RegisterRequest request) {
        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEmail(request.email());
        user.setRole(Role.USER);
        user.setStatus(true);

        UserEntity entity = UserMapper.toEntity(user);
        springDataUserRepository.save(entity);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return searchUserDetails(username);
    }
}
