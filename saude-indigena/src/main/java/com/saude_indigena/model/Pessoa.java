package com.saude_indigena.model;

import com.saude_indigena.dto.PessoaCadastroDTO;
import jakarta.persistence.*;
import jakarta.validation.Valid;
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
@Table(name = "pessoa", schema = "saude")
public class Pessoa {

    @Id
    @SequenceGenerator(name = "pessoa_seq", sequenceName = "saude.pessoa_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "pessoa_seq")
    private Long id;
    @Column(unique = true, nullable = false)
    private UUID uuid;
    @Column(nullable = false)
    private String nomeCompleto;
    @Column(unique = true, nullable = false)
    private String cpf;
    @Enumerated(EnumType.STRING)
    private Sexo sexo;
    @Column(nullable = false)
    private LocalDate dataNascimento;
    private String comorbidade;
    @Column(nullable = false)
    private String etnia;
    @Column(unique = true, nullable = false)
    private String cns;
    @Column(nullable = false)
    private String comunidade;
    private boolean ativo;
    @CreationTimestamp
    @Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime createdAt;
    @UpdateTimestamp
    @Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime updatedAt;
    @Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime removedAt;

    public Pessoa(UUID uuid, String nomeCompleto, String cpf, Sexo sexo, LocalDate dataNascimento, String comorbidade, String etnia, String cns, String comunidade, boolean ativo) {
        this.uuid = uuid;
        this.nomeCompleto = nomeCompleto;
        this.cpf = cpf;
        this.sexo = sexo;
        this.dataNascimento = dataNascimento;
        this.comorbidade = comorbidade;
        this.etnia = etnia;
        this.cns = cns;
        this.comunidade = comunidade;
        this.ativo = true;
    }

    public Pessoa(@Valid PessoaCadastroDTO dados) {
        this.uuid = UUID.randomUUID();
        this.nomeCompleto = dados.nomeCompleto();
        this.cpf = dados.cpf();
        this.sexo = dados.sexo();
        this.dataNascimento = dados.dataNascimento();
        this.etnia = dados.etnia();
        this.cns = dados.cns();
        this.comunidade = dados.comunidade();
        this.ativo = true;
    }
}
