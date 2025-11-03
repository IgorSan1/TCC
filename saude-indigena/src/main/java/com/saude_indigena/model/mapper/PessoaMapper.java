package com.saude_indigena.model.mapper;

import com.saude_indigena.dto.PessoaResponseDTO;
import com.saude_indigena.model.Pessoa;
import org.mapstruct.Mapper;
import org.mapstruct.ObjectFactory;

@Mapper(componentModel = "spring")
public interface PessoaMapper {

    PessoaResponseDTO toPessoaResponseDTO(Pessoa pessoa);

    Pessoa toPessoa(PessoaResponseDTO pessoaResponseDTO);

    @ObjectFactory
    default Pessoa createPessoa() {
        return new Pessoa();
    }
}