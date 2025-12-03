package com.saude_indigena.model.mapper;

import com.saude_indigena.dto.VacinacaoResponseDTO;
import com.saude_indigena.model.Vacinacao;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface VacinacaoMapper {

    @Mapping(source = "pessoa.uuid", target = "pessoaUuid")
    @Mapping(source = "vacina.uuid", target = "vacinaUuid")
    VacinacaoResponseDTO toVacinacaoResponseDTO(Vacinacao vacinacao);
}