package com.saude_indigena.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.saude_indigena.model.Vacinacao;
import java.time.LocalDate;
import java.util.UUID;

public record VacinacaoListagemDTO(UUID uuid,
                                   @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataAplicacao,
                                   @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataProximaDose) {
    public VacinacaoListagemDTO(Vacinacao vacinacao){
        this(vacinacao.getUuid(), vacinacao.getDataAplicacao(), vacinacao.getDataProximaDose());
    }
}
