package com.saude_indigena.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.saude_indigena.model.Pessoa;
import com.saude_indigena.model.Sexo;
import java.time.LocalDate;
import java.util.UUID;

public record PessoaListagemDTO(UUID uuid, String nomeCompleto, String cpf, Sexo sexo, @JsonFormat(pattern = "dd/MM/yyyy") LocalDate dataNascimento, String comorbidade, String etnia, String cns, String comunidade) {
    public PessoaListagemDTO(Pessoa pessoa){
        this(pessoa.getUuid(), pessoa.getNomeCompleto(), pessoa.getCpf(), pessoa.getSexo(), pessoa.getDataNascimento(), pessoa.getComorbidade(), pessoa.getEtnia(), pessoa.getCns(), pessoa.getComunidade());
    }
}
