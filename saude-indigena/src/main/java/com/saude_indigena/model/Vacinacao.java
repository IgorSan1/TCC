package com.saude_indigena.model;

import com.saude_indigena.dto.VacinacaoRegistroDTO;
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
@Table(name = "vacinacao", schema = "saude")
public class Vacinacao {

    @Id
    @SequenceGenerator(name = "vacinacao_seq", sequenceName = "saude.vacinacao_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "vacinacao_seq")
    private Long id;

    @Column(unique = true, nullable = false)
    private UUID uuid;

    @ManyToOne
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne
    @JoinColumn(name = "vacina_id", nullable = false)
    private Vacina vacina;

    @Column(nullable = false)
    private LocalDate dataAplicacao;

    private LocalDate dataProximaDose;

    @CreationTimestamp
    @Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime createdAt;
    @UpdateTimestamp
    @Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime updatedAt;
    @Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime removedAt;

    public Vacinacao(VacinacaoRegistroDTO dados){
        this.uuid = UUID.randomUUID();
        this.dataAplicacao = dados.dataAplicacao();
        this.dataProximaDose = dados.dataProximaDose();
    }

    @Override
    public String toString() {
        return "Vacinacao{" +
                "uuid=" + uuid +
                ", pessoa=" + pessoa +
                ", vacina=" + vacina +
                ", dataAplicacao=" + dataAplicacao +
                ", dataProximaDose=" + dataProximaDose +
                '}';
    }
}
