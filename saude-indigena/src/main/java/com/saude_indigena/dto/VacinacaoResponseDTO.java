package com.saude_indigena.dto;

import java.time.LocalDate;
import java.util.UUID;

public record VacinacaoResponseDTO(UUID uuid, LocalDate dataAplicacao, LocalDate dataProximaDose) {
}
