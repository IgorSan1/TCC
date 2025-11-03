package com.saude_indigena.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.saude_indigena.model.Fabricante;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record VacinaAtualizacaoDTO(@NotBlank
                                   String nome,
                                   @NotBlank
                                   String numeroLote,
                                   @JsonFormat(pattern = "dd/MM/yyyy")
                                   LocalDate dataFabricacao,
                                   @JsonFormat(pattern = "dd/MM/yyyy")
                                   LocalDate dataValidade,
                                   Fabricante fabricante) {
}
