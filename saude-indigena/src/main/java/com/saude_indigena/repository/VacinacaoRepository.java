package com.saude_indigena.repository;

import com.saude_indigena.model.Vacinacao;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VacinacaoRepository extends JpaRepository<Vacinacao, Long> {

    @Query(value = "select vacinacao.* from saude.vacinacao vacinacao where vacinacao.uuid = :vacinacaoUuid", nativeQuery = true)
    Optional<Vacinacao> buscarPorUuid(UUID vacinacaoUuid);

    @Query(value = "select vacinacao.* from saude.vacinacao", nativeQuery = true )
    List<Vacinacao> listar(Pageable pageable);
}
