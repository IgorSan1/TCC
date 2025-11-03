package com.saude_indigena.dto;

import com.saude_indigena.model.Fabricante;
import java.time.LocalDate;
import java.util.UUID;

public record VacinaResponseDTO(UUID uuid, String nome, String numeroLote, LocalDate dataFabricacao, LocalDate dataValidade, Fabricante fabricante, boolean ativo) {
}
