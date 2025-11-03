package com.saude_indigena.model;

public enum Fabricante {
    PFIZER_BIONTECH ("Pfizer Biontech"),
    ASTRAZENECA_FIOCRUZ ("AstraZeneca Fiocruz"),
    SINOVAC_BUTANTAN("Sinovac Butantan"),
    JANSSEN("Janssen"),
    MODERNA("Moderna"),
    SERUM_INSTITUTE("Serum Institute of India"),
    SANOFI_PASTEUR("Sanofi Pasteur"),
    GLAXOSMITHKLINE("GlaxoSmithKline"),
    MERCK_SHARP_DOHME("Merck Sharp & Dohme");

    private String descricao;

    Fabricante(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
}
