package com.sgdis.backend.regional.domain;

public class Regional {
    private long id;
    private String regional_code;
    private String name;
    //private Departamento departamento


    public Regional(long id, String regional_code, String name) {
        this.id = id;
        this.regional_code = regional_code;
        this.name = name;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getRegional_code() {
        return regional_code;
    }

    public void setRegional_code(String regional_code) {
        this.regional_code = regional_code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
