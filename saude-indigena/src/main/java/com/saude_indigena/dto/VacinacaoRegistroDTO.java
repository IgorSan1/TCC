package com.saude_indigena.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.UUID;

public record VacinacaoRegistroDTO(@NotBlank UUID pessoaUuid,
                                   @NotBlank UUID vacinaUuid,
                                   @NotBlank @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataAplicacao,
                                   @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataProximaDose) {
}
