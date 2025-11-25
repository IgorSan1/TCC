package com.saude_indigena.serviceImpl;

import com.saude_indigena.dto.VacinacaoAtualizacaoDTO;
import com.saude_indigena.dto.VacinacaoListagemDTO;
import com.saude_indigena.dto.VacinacaoRegistroDTO;
import com.saude_indigena.excecoes.ObjetoNaoEncontradoException;
import com.saude_indigena.excecoes.ValidacaoException;
import com.saude_indigena.model.Pessoa;
import com.saude_indigena.model.Vacina;
import com.saude_indigena.model.Vacinacao;
import com.saude_indigena.repository.VacinacaoRepository;
import com.saude_indigena.service.PessoaService;
import com.saude_indigena.service.VacinaService;
import com.saude_indigena.service.VacinacaoService;
import com.saude_indigena.util.Constantes;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class VacinacaoServiceImpl implements VacinacaoService {

    private final VacinacaoRepository vacinacaoRepository;

    private final PessoaService pessoaService;

    private final VacinaService vacinaService;

    public VacinacaoServiceImpl(VacinacaoRepository vacinacaoRepository, PessoaService pessoaService, VacinaService vacinaService) {
        this.vacinacaoRepository = vacinacaoRepository;
        this.pessoaService = pessoaService;
        this.vacinaService = vacinaService;
    }

    @Transactional
    @Override
    public Vacinacao registrar(VacinacaoRegistroDTO dados) throws DataIntegrityViolationException {
        Vacinacao vacinacao = new Vacinacao(dados);
        try {
            this.validar(dados);
            Pessoa pessoa = this.pessoaService.buscarPorUuid(dados.pessoaUuid());
            Vacina vacina = this.vacinaService.buscarPorUuid(dados.vacinaUuid());
            vacinacao.setPessoa(pessoa);
            vacinacao.setVacina(vacina);
            vacinacao = this.vacinacaoRepository.save(vacinacao);
            log.info(Constantes.VACINACAO_MSG_REGISTRADO + ": {}", vacinacao);
        }catch (DataIntegrityViolationException e){
            log.error(Constantes.VACINACAO_MSG_REGISTRADO + ": " + e.getMessage());
            throw e;
        }
        return vacinacao;
    }

    @Transactional
    @Override
    public Vacinacao atualizar(UUID vacinaUuid, VacinacaoAtualizacaoDTO dados) {
        try {
            Vacinacao vacinacao = this.buscarPorUuid(vacinaUuid);
            this.validarAtualizacao(dados);
            vacinacao.setDataAplicacao(dados.dataAplicacao());
            vacinacao.setDataProximaDose(dados.dataProximaDose());
            this.vacinacaoRepository.save(vacinacao);
            log.info(Constantes.VACINACAO_MSG_ATUALIZADA);
            return vacinacao;
        }catch (DataIntegrityViolationException e){
            log.error(Constantes.VACINACAO_MSG_FALHA_AO_ATUALIZAR + ": {}", e.getMessage());
            throw e;
        }
    }

    @Override
    public Vacinacao buscarPorUuid(UUID vacinacaoUuid) throws ObjetoNaoEncontradoException {
        Optional<Vacinacao> vacinacao = this.vacinacaoRepository.buscarPorUuid(vacinacaoUuid);
        if (vacinacao.isEmpty()) {
            log.warn(Constantes.VACINACAO_MSG_NAO_LOCALIZADA + ": {}", vacinacaoUuid);
            throw new ObjetoNaoEncontradoException(Constantes.VACINACAO_MSG_NAO_LOCALIZADA);
        }
        return vacinacao.get();
    }

    @Override
    public List<VacinacaoListagemDTO> listar(Pageable pageable) {
        List<Vacinacao> lista = this.vacinacaoRepository.listar(pageable);
        return lista.stream().map(VacinacaoListagemDTO::new).toList();
    }

    @Transactional
    @Override
    public void remover(UUID vacinacaoUuid){
        try {
            Vacinacao vacinacao = this.buscarPorUuid(vacinacaoUuid);
            this.vacinacaoRepository.delete(vacinacao);
            log.info(Constantes.VACINACAO_MSG_REMOVIDA + ": {}", vacinacao);
        }catch (DataIntegrityViolationException e){
            log.error(Constantes.VACINACAO_MSG_FALHA_AO_REMOVER + ": {}", e.getMessage());
            throw e;
        }
    }

    private void validar(VacinacaoRegistroDTO dados) {
        if (dados.dataAplicacao() == null) {
            log.error(Constantes.VACINA_VALIDACAO_CAMPO_INVALIDO + ": {}", dados);
            throw new ValidacaoException(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO);
        }
    }

    private void validarAtualizacao(VacinacaoAtualizacaoDTO dados){
        if (dados.dataAplicacao() == null) {
            log.error(Constantes.VACINA_VALIDACAO_CAMPO_INVALIDO + ": {}", dados);
            throw new ValidacaoException(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO);
        }
    }
}