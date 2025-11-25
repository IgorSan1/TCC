package com.saude_indigena.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.saude_indigena.model.Sexo;
import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PessoaCadastroDTO(@NotBlank
                                String nomeCompleto,
                                @Size(min = 11, max = 11)
                                String cpf,
                                @NotBlank
                                Sexo sexo,
                                @JsonFormat(pattern = "dd/MM/yyyy")
                                LocalDate dataNascimento,
                                String comorbidade,
                                @NotBlank
                                String etnia,
                                @NotBlank
                                @Size(min = 15, max = 15)
                                String cns,
                                @NotBlank
                                String comunidade) {
}