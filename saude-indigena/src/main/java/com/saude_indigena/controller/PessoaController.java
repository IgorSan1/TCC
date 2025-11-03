package com.saude_indigena.controller;

import com.saude_indigena.dto.*;
import com.saude_indigena.model.Pessoa;
import com.saude_indigena.model.mapper.PessoaMapper;
import com.saude_indigena.service.PessoaService;
import com.saude_indigena.util.Constantes;
import com.saude_indigena.util.ResponseApi;
import com.saude_indigena.util.TipoResponseApi;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pessoa")
public class PessoaController {

    private final PessoaService pessoaService;

    private final PessoaMapper pessoaMapper;

    public PessoaController(PessoaService pessoaService, PessoaMapper pessoaMapper) {
        this.pessoaService = pessoaService;
        this.pessoaMapper = pessoaMapper;
    }

    @Operation(summary = "Adiciona uma pessoa.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Pessoa adicionada.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @PostMapping
    public ResponseEntity<Object> adicionarPessoa(@RequestBody @Valid PessoaCadastroDTO dados) {
        Pessoa pessoa = this.pessoaService.adicionar(new Pessoa(dados));
        PessoaResponseDTO response = this.pessoaMapper.toPessoaResponseDTO(pessoa);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequestUri().path("/").buildAndExpand(pessoa.getUuid()).toUri();
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.PESSOA_MSG_ADICIONADA, HttpStatus.CREATED, response, uri);
    }

    @Operation(summary = "Atualiza uma pessoa.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Pessoa atualizada.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @PutMapping("/{pessoaUuid}")
    public ResponseEntity<Object> atualizarPessoa(@PathVariable UUID pessoaUuid, @RequestBody PessoaAtualizacaoDTO dados) {
        Pessoa pessoa = this.pessoaService.atualizar(pessoaUuid, dados);
        PessoaResponseDTO response = this.pessoaMapper.toPessoaResponseDTO(pessoa);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.PESSOA_MSG_LOCALIZADA, HttpStatus.NO_CONTENT, response, null);
    }

    @Operation(summary = "Busca uma pessoa.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pessoa.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @GetMapping("/{pessoaUuid}")
    public ResponseEntity<Object> buscarPorUuid(@PathVariable UUID pessoaUuid) {
        Pessoa pessoa = this.pessoaService.buscarPorUuid(pessoaUuid);
        PessoaResponseDTO response = this.pessoaMapper.toPessoaResponseDTO(pessoa);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.PESSOA_MSG_LOCALIZADA, HttpStatus.OK, response, null);
    }

    @Operation(summary = "Busca uma pessoa.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pessoa.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @PostMapping("/buscar-por-cpf")
    public ResponseEntity<Object> buscarPorCpf(@RequestBody PessoaBuscaCpfDTO dados) {
        Pessoa pessoa = this.pessoaService.buscarPorCpf(dados);
        PessoaResponseDTO response = this.pessoaMapper.toPessoaResponseDTO(pessoa);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.PESSOA_MSG_LOCALIZADA, HttpStatus.OK, response, null);
    }

    @Operation(summary = "Lista as pessoas.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de pessoas.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @GetMapping
    public ResponseEntity<Object> listarPessoa(@PageableDefault Pageable pageable) {
        List<PessoaListagemDTO> lista = this.pessoaService.listar(pageable);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.PESSOA_MSG_LISTA, HttpStatus.OK, lista, null);
    }

    @Operation(summary = "Lista todas as pessoas.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todas as pessoas.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @GetMapping("/all")
    public ResponseEntity<Object> listarTodos(@PageableDefault Pageable pageable){
        List<PessoaListagemDTO> lista = this.pessoaService.listarTodos(pageable);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.PESSOA_MSG_LISTA, HttpStatus.OK, lista, null);
    }

    @Operation(summary = "Remove uma pessoa.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Pessoa removida.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @DeleteMapping("/{pessoaUuid}")
    public ResponseEntity<Object> removerPessoa(@PathVariable UUID pessoaUuid) {
        this.pessoaService.remover(pessoaUuid);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.PESSOA_MSG_REMOVIDA, HttpStatus.NO_CONTENT, null, null);
    }

}
