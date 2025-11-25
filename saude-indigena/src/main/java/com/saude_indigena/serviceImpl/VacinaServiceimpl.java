package com.saude_indigena.serviceImpl;

import com.saude_indigena.dto.VacinaAtualizacaoDTO;
import com.saude_indigena.dto.VacinaListagemDTO;
import com.saude_indigena.excecoes.ObjetoNaoEncontradoException;
import com.saude_indigena.excecoes.ValidacaoException;
import com.saude_indigena.model.Vacina;
import com.saude_indigena.repository.VacinaRepository;
import com.saude_indigena.service.VacinaService;
import com.saude_indigena.util.Constantes;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class VacinaServiceimpl implements VacinaService {

    private final VacinaRepository vacinaRepository;

    public VacinaServiceimpl(VacinaRepository vacinaRepository) {
        this.vacinaRepository = vacinaRepository;
    }

    @Transactional
    @Override
    public Vacina adicionar(Vacina vacina) throws DataIntegrityViolationException {
        try {
            this.validar(vacina);
            vacina = this.vacinaRepository.save(vacina);
            log.info(Constantes.VACINA_MSG_ADICIONADA + ": {}", vacina);
        }catch (DataIntegrityViolationException e) {
            log.error(Constantes.VACINA_MSG_FALHA_AO_ADICIONAR + ": " + e.getMessage());
            throw e;
        }
        return vacina;
    }

    @Transactional
    @Override
    public Vacina atualizar(UUID vacinaUuid, VacinaAtualizacaoDTO dados) {
        try {
            Vacina vacina = this.buscarPorUuid(vacinaUuid);
            if (vacina.getAtivo()){
                this.validarAtualizacao(dados);
                vacina.setNome(dados.nome());
                vacina.setNumeroLote(dados.numeroLote());
                vacina.setDataFabricacao(dados.dataFabricacao());
                vacina.setDataValidade(dados.dataValidade());
                vacina.setFabricante(dados.fabricante());
                if (dados.ativo() != null){
                    vacina.setAtivo(dados.ativo());
                }
                this.vacinaRepository.save(vacina);
                log.info(Constantes.VACINA_MSG_ATUALIZADA);
                return vacina;
            }else{
                log.error(Constantes.VACINA_MSG_FALHA_AO_ATUALIZAR + ": Vacina {} inativa", vacina.getNome());
                throw new ObjetoNaoEncontradoException(Constantes.VACINA_MSG_FALHA_AO_ATUALIZAR);
            }
        }catch (DataIntegrityViolationException e){
            log.error(Constantes.VACINA_MSG_FALHA_AO_ATUALIZAR + ": {}", e.getMessage());
            throw e;
        }
    }

    @Override
    public List<VacinaListagemDTO> listar(Pageable pageable) {
        List<Vacina> listaVacina = this.vacinaRepository.listar(pageable);
        return listaVacina.stream().map(VacinaListagemDTO::new).toList();
    }

    @Override
    public List<VacinaListagemDTO> listarTodos(Pageable pageable) {
        List<Vacina> listaVacina = this.vacinaRepository.listarTodos(pageable);
        return listaVacina.stream().map(VacinaListagemDTO::new).toList();
    }

    @Override
    public Vacina buscarPorUuid(UUID vacinaUuid) throws ObjetoNaoEncontradoException {
        Optional<Vacina> vacina = this.vacinaRepository.buscarPorUuid(vacinaUuid);
        if (vacina.isEmpty()) {
            log.warn(Constantes.VACINA_MSG_NAO_LOCALIZADA + ": {}", vacinaUuid);
            throw new ObjetoNaoEncontradoException(Constantes.VACINA_MSG_NAO_LOCALIZADA);
        }
        return vacina.get();
    }

    @Transactional
    @Override
    public void remover(UUID vacinaUuid) {
        try {
            Vacina vacina = this.buscarPorUuid(vacinaUuid);
            if (vacina.getAtivo()){
                vacina.setRemovedAt(OffsetDateTime.now());
                vacina.setAtivo(false);
                this.vacinaRepository.save(vacina);
                log.info(Constantes.VACINA_MSG_REMOVIDA + ": {}", vacina);
            }else{
                log.error(Constantes.VACINA_MSG_FALHA_AO_REMOVER + " - Vacina {} inativa", vacina.getNome());
                throw new ObjetoNaoEncontradoException(Constantes.VACINA_MSG_FALHA_AO_REMOVER);
            }
        }catch (DataIntegrityViolationException e){
            log.error(Constantes.VACINA_MSG_FALHA_AO_REMOVER + ": {}", e.getMessage());
            throw e;
        }
    }

    private void validar(Vacina vacina) {
        if (vacina.getNome() == null || vacina.getNumeroLote() == null || vacina.getDataFabricacao() == null || vacina.getDataValidade() == null || vacina.getFabricante() == null) {
            log.error(Constantes.VACINA_VALIDACAO_CAMPO_INVALIDO + ": {}", vacina);
            throw new ValidacaoException(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO);
        }
        if (vacina.getNome().isEmpty() || vacina.getNome().isBlank() || vacina.getNumeroLote().isEmpty() || vacina.getNumeroLote().isBlank()) {
            log.warn(Constantes.VACINA_MSG_FALHA_AO_VALIDAR + ": {}", vacina);
            throw new ValidacaoException(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO);
        }
    }

    private void validarAtualizacao(VacinaAtualizacaoDTO dados) {
        if (dados.nome() == null || dados.numeroLote() == null || dados.dataFabricacao() == null || dados.dataValidade() == null || dados.fabricante() == null) {
            log.error(Constantes.VACINA_VALIDACAO_CAMPO_INVALIDO + ": {}", dados);
            throw new ValidacaoException(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO);
        }
        if (dados.nome().isEmpty() || dados.nome().isBlank() || dados.numeroLote().isEmpty() || dados.numeroLote().isBlank()) {
            log.warn(Constantes.VACINA_MSG_FALHA_AO_VALIDAR + ": {}", dados);
            throw new ValidacaoException(Constantes.VACINA_VALIDACAO_CAMPO_INVALIDO);
        }
    }
}