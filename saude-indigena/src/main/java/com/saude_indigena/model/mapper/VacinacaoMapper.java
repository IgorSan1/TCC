package com.saude_indigena.model.mapper;

import com.saude_indigena.dto.VacinacaoResponseDTO;
import com.saude_indigena.model.Vacinacao;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = {PessoaMapper.class, VacinaMapper.class})
public interface VacinacaoMapper {
    VacinacaoResponseDTO toVacinacaoResponseDTO(Vacinacao vacinacao);
}
