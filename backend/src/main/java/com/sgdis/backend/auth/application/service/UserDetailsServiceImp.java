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
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.file.service.FileUploadService;
import com.sgdis.backend.exception.userExceptions.UserNotFoundException;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImp implements LoginUseCase, AuthenticateUseCase, SearchUsernameUseCase, RefreshTokenUseCase, RegisterUseCase, UserDetailsService {

    private final SpringDataUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final FileUploadService fileUploadService;

    @Override
    public AuthResponse login(AuthRequest authLoginRequest) {
        String email = authLoginRequest.email();
        String password = authLoginRequest.password();

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));

        if (!user.isStatus()) {
            throw new BadCredentialsException("Invalid email or password!");
        }

        Authentication authentication = this.authenticate(user.getId(), password);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwtToken = jwtUtils.createToken(authentication);
        String refreshToken = jwtUtils.createRefreshToken(authentication);

        return new AuthResponse(user.getId(), email, user.getRole(), "logged successfully!", jwtToken, refreshToken,true);
    }

    @Override
    public Authentication authenticate(Long id, String password) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        UserDetails userDetails = this.searchUserDetails(user.getEmail());

        if (userDetails == null) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new BadCredentialsException("invalid password");
        }

        return new UsernamePasswordAuthenticationToken(id, null, userDetails.getAuthorities());
    }

    @Override
    public UserDetails searchUserDetails(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));

        GrantedAuthority role = new SimpleGrantedAuthority("ROLE_".concat(user.getRole().name()));

        return new org.springframework.security.core.userdetails.User(email, user.getPassword(), Set.of(role));
    }

    @Override
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        try {
            DecodedJWT decodedJWT = jwtUtils.verifyToken(request.refreshToken());
            Long userId = decodedJWT.getClaim("userId").asLong();

            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new UserNotFoundException(userId));

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
        if (!request.email().endsWith("@soy.sena.edu.co") && !request.email().endsWith("@sena.edu.co")) {
            throw new IllegalArgumentException("Email must be from @soy.sena.edu.co or @sena.edu.co domain");
        }

        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        UserEntity user = UserEntity.builder()
                .password(passwordEncoder.encode(request.password()))
                .email(request.email())
                .fullName(request.fullName())
                .jobTitle(request.jobTitle())
                .laborDepartment(request.laborDepartment())
                .imgUrl(null)
                .role(Role.USER)
                .status(true)
                .build();

        userRepository.save(user);
    }

    public void updateProfileImage(Long userId, MultipartFile file) throws IOException {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (user.getImgUrl() != null) {
            fileUploadService.deleteFile(user.getImgUrl());
        }

        String imgUrl = fileUploadService.saveFile(file, user.getEmail());
        user.setImgUrl(imgUrl);

        userRepository.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return searchUserDetails(username);
    }
}
