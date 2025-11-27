package com.saude_indigena.serviceImpl;

import com.saude_indigena.dto.PessoaAtualizacaoDTO;
import com.saude_indigena.dto.PessoaBuscaCpfDTO;
import com.saude_indigena.dto.PessoaListagemDTO;
import com.saude_indigena.excecoes.ObjetoNaoEncontradoException;
import com.saude_indigena.excecoes.ValidacaoException;
import com.saude_indigena.model.Pessoa;
import com.saude_indigena.repository.PessoaRepository;
import com.saude_indigena.service.PessoaService;
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

@Slf4j
@Service
public class PessoaServiceImpl implements PessoaService {

    private final PessoaRepository pessoaRepository;

    //private PessoaMapper pessoaMapper;

    public PessoaServiceImpl(PessoaRepository pessoaRepository) {
        this.pessoaRepository = pessoaRepository;
    }

    @Transactional
    @Override
    public Pessoa adicionar(Pessoa pessoa) throws DataIntegrityViolationException {
        try {
            this.validar(pessoa);
            pessoa = this.pessoaRepository.save(pessoa);
            log.info(Constantes.PESSOA_MSG_ADICIONADA + ": {}", pessoa);
        } catch (DataIntegrityViolationException e) {
            log.error(Constantes.PESSOA_MSG_FALHA_AO_ADICIONAR + ": " + e.getMessage());
            throw e;
        }
        return pessoa;
    }

    @Transactional
    @Override
    public Pessoa atualizar(UUID pessoaUuid, PessoaAtualizacaoDTO dados) {
        try {
            Pessoa pessoa = this.buscarPorUuid(pessoaUuid);
                this.validarAtualizacao(dados);
                pessoa.setNomeCompleto(dados.nomeCompleto());
                pessoa.setCpf(dados.cpf());
                pessoa.setSexo(dados.sexo());
                pessoa.setDataNascimento(dados.dataNascimento());
                if (dados.comorbidade() != null) {
                    pessoa.setComorbidade(dados.comorbidade());
                }
                pessoa.setEtnia(dados.etnia());
                pessoa.setCns(dados.cns());
                pessoa.setComunidade(dados.comunidade());
                if (dados.ativo() != null) {
                    pessoa.setAtivo(dados.ativo());
                }
                this.pessoaRepository.save(pessoa);
                log.info(Constantes.PESSOA_MSG_ATUALIZADA);
                return pessoa;
        } catch (DataIntegrityViolationException e) {
            log.error(Constantes.PESSOA_MSG_FALHA_AO_ATUALIZAR + ": {}", e.getMessage());
            throw e;
        }
    }

    @Override
    public List<PessoaListagemDTO> listar(Pageable pageable) {
        List<Pessoa> listaPessoa = this.pessoaRepository.listar(pageable);
        return listaPessoa.stream().map(PessoaListagemDTO::new).toList();
    }

    @Override
    public List<PessoaListagemDTO> listarTodos(Pageable pageable) {
        List<Pessoa> listaPessoa = this.pessoaRepository.listarTodos(pageable);
        return listaPessoa.stream().map(PessoaListagemDTO::new).toList();
    }

    @Override
    public Pessoa buscarPorUuid(UUID pessoaUuid) throws ObjetoNaoEncontradoException {
        Optional<Pessoa> pessoa = this.pessoaRepository.buscarPorUuid(pessoaUuid);
        if (pessoa.isEmpty()) {
            log.warn(Constantes.PESSOA_MSG_NAO_LOCALIZADA + ": {}", pessoaUuid);
            throw new ObjetoNaoEncontradoException(Constantes.PESSOA_MSG_NAO_LOCALIZADA);
        }
        return pessoa.get();
    }

    @Override
    public Pessoa buscarPorCpf(PessoaBuscaCpfDTO dados) throws ObjetoNaoEncontradoException {
        Optional<Pessoa> pessoa  = this.pessoaRepository.buscarPorCpf(dados.cpf());
        if (pessoa.isEmpty()) {
            log.warn(Constantes.PESSOA_MSG_NAO_LOCALIZADA + ": {}", dados.cpf());
            throw new ObjetoNaoEncontradoException(Constantes.PESSOA_MSG_NAO_LOCALIZADA);
        }
        return pessoa.get();
    }

    @Transactional
    @Override
    public void remover(UUID pessoaUuid) {
        try {
            Pessoa pessoa = this.buscarPorUuid(pessoaUuid);
            if (pessoa.isAtivo()) {
                pessoa.setRemovedAt(OffsetDateTime.now());
                pessoa.setAtivo(false);
                // TODO - linguagem.setRemovedBy(usuarioUuid);
                this.pessoaRepository.save(pessoa);
                log.info(Constantes.PESSOA_MSG_REMOVIDA);
            } else {
                log.error(Constantes.PESSOA_MSG_FALHA_AO_REMOVER + " - Pessoa {} inativa", pessoa.getNomeCompleto());
                throw new ObjetoNaoEncontradoException(Constantes.PESSOA_MSG_FALHA_AO_REMOVER);
            }
        } catch (DataIntegrityViolationException e) {
            log.error(Constantes.PESSOA_MSG_FALHA_AO_REMOVER + ": {}", e.getMessage());
            throw e;
        }
    }

    private void validar(Pessoa pessoa) {
        if (pessoa.getNomeCompleto() == null || pessoa.getCpf() == null || pessoa.getDataNascimento() == null || pessoa.getEtnia() == null || pessoa.getCns() == null || pessoa.getComunidade() == null || pessoa.getComorbidade() == null) {
            log.error(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO + ": {}", pessoa);
            throw new ValidacaoException(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO);
        }
        if (pessoa.getNomeCompleto().isEmpty() || pessoa.getNomeCompleto().isBlank() || pessoa.getCpf().isEmpty() || pessoa.getCpf().isBlank() || pessoa.getEtnia().isEmpty() || pessoa.getCns().isEmpty() || pessoa.getCns().isBlank() || pessoa.getComunidade().isEmpty() || pessoa.getComunidade().isBlank()) {
            log.warn(Constantes.PESSOA_MSG_FALHA_AO_VALIDAR + ": {}", pessoa);
            throw new ValidacaoException(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO);
        }
    }

    private void validarAtualizacao(PessoaAtualizacaoDTO dados) {
        if (dados.nomeCompleto() == null || dados.cpf() == null || dados.dataNascimento() == null || dados.etnia() == null || dados.cns() == null || dados.comunidade() == null) {
            log.error(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO + ": {}", dados);
            throw new ValidacaoException(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO);
        }
        if (dados.nomeCompleto().isEmpty() || dados.nomeCompleto().isBlank() || dados.cpf().isEmpty() || dados.cpf().isBlank() || dados.etnia().isEmpty() || dados.etnia().isBlank() || dados.cns().isEmpty() || dados.cns().isBlank() || dados.comunidade().isEmpty() || dados.comunidade().isBlank()) {
            log.warn(Constantes.PESSOA_MSG_FALHA_AO_VALIDAR + ": {}", dados);
            throw new ValidacaoException(Constantes.PESSOA_VALIDACAO_CAMPO_INVALIDO);
        }
    }
}