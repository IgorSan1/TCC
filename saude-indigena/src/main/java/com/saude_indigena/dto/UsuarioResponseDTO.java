package com.saude_indigena.dto;

import com.saude_indigena.model.Cargo;
import com.saude_indigena.model.UserRole;

import java.time.LocalDate;
import java.util.UUID;

public record UsuarioResponseDTO(UUID uuid, String nomeCompleto, String cpf, LocalDate dataNascimento, String email, String telefone, String usuario, String password, UserRole role, Cargo cargo, Boolean ativo) {
}