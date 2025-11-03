package com.saude_indigena.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.saude_indigena.model.Sexo;
import java.time.LocalDate;
import java.util.UUID;

public record PessoaResponseDTO(UUID uuid, String nomeCompleto, String cpf, Sexo sexo, @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataNascimento, String comorbidade, String etnia, String cns, String comunidade, boolean ativo) {
}
