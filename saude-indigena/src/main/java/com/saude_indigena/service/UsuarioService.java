package com.saude_indigena.service;

import com.saude_indigena.dto.UsuarioAtualizacaoDTO;
import com.saude_indigena.dto.UsuarioListagemDTO;
import com.saude_indigena.excecoes.ObjetoNaoEncontradoException;
import com.saude_indigena.model.Usuario;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

public interface UsuarioService {

    Usuario adicionar(Usuario usuario) throws DataIntegrityViolationException;

    List<UsuarioListagemDTO> listar(Pageable pageable);

    Usuario buscarPorUuid(UUID usuarioUuid)throws ObjetoNaoEncontradoException;

    Usuario atualizar(UUID usuarioUuid, UsuarioAtualizacaoDTO dados);

    void remover(UUID usuarioUuid);
}
