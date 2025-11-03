package com.saude_indigena.model;

public enum Cargo {

    TECNICO("tecnico"),
    ENFERMEIRO("enfermeiro"),
    TECNICO_DE_ENFERMAGEM("tecnico de enfermagem");

    private String cargo;

    Cargo(String cargo) {
        this.cargo = cargo;
    }
    public String getRole() {
        return cargo;
    }

    public void setRole(String cargo){
        this.cargo = cargo;
    }
}
