package com.sgdis.backend.inventory.domain;

import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.user.domain.User;

import java.util.List;
import java.util.UUID;

public class Inventory {
    private Long id;
    private UUID uuid;
    private String location;
    private String name;
    private User owner;
    private List<User> managers;
    private List<RegionalEntity>  regionalEntities;

    public List<RegionalEntity> getRegionalEntities() {
        return regionalEntities;
    }

    public void setRegionalEntities(List<RegionalEntity> regionalEntities) {
        this.regionalEntities = regionalEntities;
    }

    public Inventory(Long id, UUID uuid, String location, String name, User owner, List<User> managers, List<RegionalEntity> regionalEntities) {
        this.id = id;
        this.uuid = uuid;
        this.location = location;
        this.name = name;
        this.owner = owner;
        this.managers = managers;
        this.regionalEntities = regionalEntities;
    }

    public Inventory() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getUuid() {
        return uuid;
    }

    public void setUuid(UUID uuid) {
        this.uuid = uuid;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public List<User> getManagers() {
        return managers;
    }

    public void setManagers(List<User> managers) {
        this.managers = managers;
    }
}