package com.sgdis.backend.inventory.domain;

import com.sgdis.backend.user.domain.User;

import java.util.UUID;

public class Inventory {
    private Long id;
    private UUID uuid;
    private String location;
    private String name;
    private User owner;

    public Inventory(Long id, UUID uuid, String location, String name, User owner) {
        this.id = id;
        this.uuid = uuid;
        this.location = location;
        this.name = name;
        this.owner = owner;
    }

    public Inventory() {
    }

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
}
