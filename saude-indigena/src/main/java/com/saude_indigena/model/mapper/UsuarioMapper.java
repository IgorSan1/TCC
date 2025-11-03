package com.saude_indigena.model.mapper;

import com.saude_indigena.dto.UsuarioResponseDTO;
import com.saude_indigena.model.Usuario;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    UsuarioResponseDTO toUsuarioResponseDTO(Usuario usuario);
}
