package com.saude_indigena.model;

import com.saude_indigena.dto.VacinaCadastroDTO;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "vacina", schema = "saude")
public class Vacina {

    @Id
    @SequenceGenerator(name = "vacina_seq", sequenceName = "saude.vacina_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "vacina_seq")
    private Long id;
    @Column(unique = true, nullable = false)
    private UUID uuid;
    @Column(nullable = false)
    private String nome;
    @Column(nullable = false)
    private String numeroLote;
    @Column(nullable = false)
    private LocalDate dataFabricacao;
    @Column(nullable = false)
    private LocalDate dataValidade;
    @Enumerated(EnumType.STRING)
    private Fabricante fabricante;
    private Boolean ativo;
    @CreationTimestamp
    @Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime createdAt;
    @UpdateTimestamp
    @Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime updatedAt;
    @Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime removedAt;

    public Vacina(UUID uuid, String nome, String numeroLote, LocalDate dataFabricacao, LocalDate dataValidade, Fabricante fabricante, Boolean ativo) {
        this.uuid = uuid;
        this.nome = nome;
        this.numeroLote = numeroLote;
        this.dataFabricacao = dataFabricacao;
        this.dataValidade = dataValidade;
        this.fabricante = fabricante;
        this.ativo = ativo;
    }

    public Vacina(VacinaCadastroDTO dados){
        this.uuid = UUID.randomUUID();
        this.nome = dados.nome();
        this.numeroLote = dados.numeroLote();
        this.dataFabricacao = dados.dataFabricacao();
        this.dataValidade = dados.dataValidade();
        this.fabricante = dados.fabricante();
        this.ativo = true;
    }
}