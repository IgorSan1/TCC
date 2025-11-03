package com.saude_indigena.repository;

import com.saude_indigena.dto.UsuarioListagemDTO;
import com.saude_indigena.model.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    @Query(value = "select usuario.* from saude.usuario", nativeQuery = true)
    List<Usuario> listar(Pageable pageable);

    @Query(value = "select usuario.* from saude.usuario usuario where usuario.uuid = :usuarioUuid", nativeQuery = true)
    Optional<Usuario> buscarPorUuid(UUID usuarioUuid);

    UserDetails findByUsuario(String usuario);
}
