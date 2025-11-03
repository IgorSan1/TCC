package com.saude_indigena.dto;

import com.saude_indigena.model.Cargo;
import com.saude_indigena.model.UserRole;
import com.saude_indigena.model.Usuario;
import java.time.LocalDate;
import java.util.UUID;

public record UsuarioListagemDTO(UUID uuid, String nomeCompleto, String cpf, LocalDate dataNascimento, String email, String telefone, Cargo cargo, String usuario, String password, UserRole role) {
    public UsuarioListagemDTO(Usuario usuario){
        this(usuario.getUuid(), usuario.getNomeCompleto(), usuario.getCpf(), usuario.getDataNascimento(), usuario.getEmail(), usuario.getTelefone(), usuario.getCargo(), usuario.getUsuario(), usuario.getPassword(), usuario.getRole());
    }
}
