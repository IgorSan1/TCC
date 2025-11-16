package com.saude_indigena.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.saude_indigena.model.Cargo;
import com.saude_indigena.model.UserRole;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record UsuarioAtualizacaoDTO(@NotBlank String nomeCompleto,
                                    @NotBlank String cpf,
                                    @NotBlank @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataNascimento,
                                    @NotBlank String email,
                                    @NotBlank String telefone,
                                    @NotBlank String usuario,
                                    String password,
                                    @NotBlank UserRole role,
                                    @NotBlank Cargo cargo) {
}
