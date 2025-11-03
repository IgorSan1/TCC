package com.saude_indigena.controller;

import com.saude_indigena.dto.VacinaAtualizacaoDTO;
import com.saude_indigena.dto.VacinaCadastroDTO;
import com.saude_indigena.dto.VacinaListagemDTO;
import com.saude_indigena.dto.VacinaResponseDTO;
import com.saude_indigena.model.Vacina;
import com.saude_indigena.model.mapper.VacinaMapper;
import com.saude_indigena.service.VacinaService;
import com.saude_indigena.util.Constantes;
import com.saude_indigena.util.ResponseApi;
import com.saude_indigena.util.TipoResponseApi;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
@RequestMapping("/vacina")
public class VacinaController {

    private final VacinaService vacinaService;

    private final VacinaMapper vacinaMapper;

    public VacinaController(VacinaService vacinaService, VacinaMapper vacinaMapper) {
        this.vacinaService = vacinaService;
        this.vacinaMapper = vacinaMapper;
    }

    @Operation(summary = "Adiciona uma vacina.")
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
    public ResponseEntity<Object> adicionarVacina(@RequestBody VacinaCadastroDTO dados){
        Vacina vacina = this.vacinaService.adicionar(new Vacina(dados));
        VacinaResponseDTO response = this.vacinaMapper.toVacinaResponseDTO(vacina);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequestUri().path("/").buildAndExpand(vacina.getUuid()).toUri();
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.VACINA_MSG_ADICIONADA, HttpStatus.CREATED, response, uri);
    }

    @Operation(summary = "Atualiza uma vacina.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Vacina atualizada.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @PutMapping("/{vacinaUuid}")
    public ResponseEntity<Object> atualizarVacina(@PathVariable UUID vacinaUuid, @RequestBody VacinaAtualizacaoDTO dados){
        Vacina vacina = this.vacinaService.atualizar(vacinaUuid, dados);
        VacinaResponseDTO response = this.vacinaMapper.toVacinaResponseDTO(vacina);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.VACINA_MSG_LOCALIZADA, HttpStatus.NO_CONTENT, response, null);
    }

    @Operation(summary = "Busca uma vacina.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vacina.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @GetMapping("/{vacinaUuid}")
    public ResponseEntity<Object> buscarPorUuid(@PathVariable UUID vacinaUuid){
        Vacina vacina = this.vacinaService.buscarPorUuid(vacinaUuid);
        VacinaResponseDTO response = this.vacinaMapper.toVacinaResponseDTO(vacina);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.PESSOA_MSG_LOCALIZADA, HttpStatus.OK, response, null);
    }

    @Operation(summary = "Lista as vacinas.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de vacinas.",
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
    public ResponseEntity<Object> listar(@PageableDefault Pageable pageable){
        List<VacinaListagemDTO> lista = this.vacinaService.listar(pageable);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.VACINA_MSG_LISTA, HttpStatus.OK, lista, null);
    }

    @Operation(summary = "Lista todas as vacinas.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todas as vacinas.",
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
        List<VacinaListagemDTO> lista = this.vacinaService.listarTodos(pageable);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.VACINA_MSG_LISTA, HttpStatus.OK, lista, null);
    }

    @Operation(summary = "Remove uma vacina.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Pessoa vacina.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @DeleteMapping("/{vacinaUuid}")
    public ResponseEntity<Object> removerVacina(@PathVariable UUID vacinaUuid){
        this.vacinaService.remover(vacinaUuid);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.VACINA_MSG_REMOVIDA, HttpStatus.NO_CONTENT, null, null);
    }
}