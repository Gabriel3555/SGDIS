package com.sgdis.backend.institution.domain;

import com.sgdis.backend.data.departaments_cities.entity.CityEntity;
import com.sgdis.backend.data.regional.RegionalEntity;

import java.util.List;

public class Institution {
    private Long id;
    private String name;
    private List<RegionalEntity> regionals;
    private List<CityEntity> cities;

    public Institution(Long id, String name, List<RegionalEntity> regionals, List<CityEntity> cities) {
        this.id = id;
        this.name = name;
        this.regionals = regionals;
        this.cities = cities;
    }

    public Institution() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<RegionalEntity> getRegionals() {
        return regionals;
    }

    public void setRegionals(List<RegionalEntity> regionals) {
        this.regionals = regionals;
    }

    public List<CityEntity> getCities() {
        return cities;
    }

    public void setCities(List<CityEntity> cities) {
        this.cities = cities;
    }
}
