package com.saude_indigena.model.mapper;

import com.saude_indigena.dto.VacinaResponseDTO;
import com.saude_indigena.model.Vacina;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface VacinaMapper {

    VacinaResponseDTO toVacinaResponseDTO(Vacina vacina);

    Vacina toVacina(VacinaResponseDTO vacinaResponseDTO);
}
