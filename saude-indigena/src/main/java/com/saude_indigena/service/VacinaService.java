package com.saude_indigena.service;

import com.saude_indigena.dto.VacinaAtualizacaoDTO;
import com.saude_indigena.dto.VacinaListagemDTO;
import com.saude_indigena.excecoes.ObjetoNaoEncontradoException;
import com.saude_indigena.model.Vacina;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

public interface VacinaService {
    Vacina adicionar(Vacina vacina) throws DataIntegrityViolationException;

    List<VacinaListagemDTO> listar(Pageable pageable);

    List<VacinaListagemDTO> listarTodos(Pageable pageable);

    Vacina buscarPorUuid(UUID vacinaUuid) throws ObjetoNaoEncontradoException;

    Vacina atualizar(UUID vacinaUuid, VacinaAtualizacaoDTO dados);

    void remover(UUID vacinaUuid);
}
