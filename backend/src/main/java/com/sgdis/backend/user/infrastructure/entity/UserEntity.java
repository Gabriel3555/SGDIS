package com.sgdis.backend.user.infrastructure.entity;

import com.sgdis.backend.user.domain.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String password;
    @Column(unique = true)
    private String email;
    private String fullName;
    private String jobTitle;
    private String laborDepartment;
    private String imgUrl;
    @Enumerated(EnumType.STRING)
    private Role role;
    private boolean status = true;
}
