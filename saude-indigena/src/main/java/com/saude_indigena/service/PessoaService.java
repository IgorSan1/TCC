package com.saude_indigena.service;

import com.saude_indigena.dto.PessoaAtualizacaoDTO;
import com.saude_indigena.dto.PessoaBuscaCpfDTO;
import com.saude_indigena.dto.PessoaListagemDTO;
import com.saude_indigena.excecoes.ObjetoNaoEncontradoException;
import com.saude_indigena.model.Pessoa;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

public interface PessoaService {
    Pessoa adicionar(Pessoa pessoa) throws DataIntegrityViolationException;

    List<PessoaListagemDTO> listar(Pageable pageable);

    List<PessoaListagemDTO> listarTodos(Pageable pageable);

    Pessoa buscarPorUuid(UUID pessoaUuid) throws ObjetoNaoEncontradoException;

    Pessoa buscarPorCpf(PessoaBuscaCpfDTO dados) throws ObjetoNaoEncontradoException;

    Pessoa atualizar(UUID pessoaUuid, PessoaAtualizacaoDTO dados);

    void remover(UUID pessoaUuid);
}
