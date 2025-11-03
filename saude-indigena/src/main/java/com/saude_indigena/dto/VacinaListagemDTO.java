package com.saude_indigena.dto;

import com.saude_indigena.model.Fabricante;
import com.saude_indigena.model.Vacina;
import java.time.LocalDate;
import java.util.UUID;

public record VacinaListagemDTO(UUID uuid, String nome, String numeroLote, LocalDate dataFabricacao, LocalDate dataValidade, Fabricante fabricante, Boolean ativo) {
    public VacinaListagemDTO(Vacina vacina){
        this(vacina.getUuid(), vacina.getNome(), vacina.getNumeroLote(), vacina.getDataFabricacao(), vacina.getDataValidade(), vacina.getFabricante(), vacina.getAtivo());
    }
}
