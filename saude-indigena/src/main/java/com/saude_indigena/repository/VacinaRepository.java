package com.saude_indigena.repository;

import com.saude_indigena.model.Vacina;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VacinaRepository extends JpaRepository<Vacina, Long> {

    @Query(value = "select vacina.* from saude.vacina vacina where vacina.ativo is true", nativeQuery = true )
    List<Vacina> listar(Pageable pageable);

    @Query(value = "select vacina.* from saude.vacina", nativeQuery = true)
    List<Vacina> listarTodos(Pageable pageable);

    @Query(value = "select vacina.* from saude.vacina vacina where vacina.uuid = :vacinaUuid", nativeQuery = true)
    Optional<Vacina> buscarPorUuid(UUID vacinaUuid);
}
