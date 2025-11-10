package com.sgdis.backend.user.domain;

import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.inventory.domain.Inventory;

import java.util.List;

public class User {
    private Long id;
    private String password;
    private String email;
    private String fullName;
    private String jobTitle;
    private String laborDepartment;
    private String imgUrl;
    private Role role;
    private boolean status;
    private List<Inventory> inventories;
    private List<RegionalEntity> regionals;
    
    public User(Long id, String password, String email, String fullName, String jobTitle, String laborDepartment, String imgUrl, Role role, boolean status, List<Inventory> inventories, List<RegionalEntity> regionals) {
        this.id = id;
        this.password = password;
        this.email = email;
        this.fullName = fullName;
        this.jobTitle = jobTitle;
        this.laborDepartment = laborDepartment;
        this.imgUrl = imgUrl;
        this.role = role;
        this.status = status;
        this.inventories = inventories;
        this.regionals = regionals;
    }

    public User() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isStatus() {
        return status;
    }

    public void setStatus(boolean status) {
        this.status = status;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getLaborDepartment() {
        return laborDepartment;
    }

    public void setLaborDepartment(String laborDepartment) {
        this.laborDepartment = laborDepartment;
    }

    public String getImgUrl() {
        return imgUrl;
    }

    public void setImgUrl(String imgUrl) {
        this.imgUrl = imgUrl;
    }
    
    public List<Inventory> getInventories() {
        return inventories;
    }
    
    public void setInventories(List<Inventory> inventories) {
        this.inventories = inventories;
    }

    public List<RegionalEntity> getRegionals() {
        return regionals;
    }

    public void setRegionals(List<RegionalEntity> regionals) {}
}
