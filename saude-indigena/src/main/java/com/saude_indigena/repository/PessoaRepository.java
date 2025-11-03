package com.saude_indigena.repository;

import com.saude_indigena.model.Pessoa;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {
    @Query(value = "select pessoa.* from saude.pessoa pessoa where pessoa.ativo is true", nativeQuery = true)
    List<Pessoa> listar(Pageable pageable);

    @Query(value = "select pessoa.* from saude.pessoa", nativeQuery = true)
    List<Pessoa> listarTodos(Pageable pageable);

    @Query(value = "select pessoa.* from saude.pessoa pessoa where pessoa.uuid = :pessoaUuid", nativeQuery = true)
    Optional<Pessoa> buscarPorUuid(UUID pessoaUuid);

    @Query(value = "select pessoa.* from saude.pessoa pessoa where pessoa.cpf = :pessoaCpf", nativeQuery = true)
    Optional<Pessoa> buscarPorCpf(String pessoaCpf);
}
