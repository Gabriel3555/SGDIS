package com.sgdis.backend.institution.domain;

import com.sgdis.backend.data.departaments_cities.entity.CityEntity;
import com.sgdis.backend.data.regional.RegionalEntity;

public class Institution {
    private Long id;
    private String name;
    private RegionalEntity regional;
    private CityEntity city;

    public Institution() {}

    public Institution(Long id, String name, RegionalEntity regional, CityEntity city) {
        this.id = id;
        this.name = name;
        this.regional = regional;
        this.city = city;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public RegionalEntity getRegional() { return regional; }
    public void setRegional(RegionalEntity regional) { this.regional = regional; }

    public CityEntity getCity() { return city; }
    public void setCity(CityEntity city) { this.city = city; }
}
