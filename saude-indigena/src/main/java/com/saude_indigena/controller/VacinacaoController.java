package com.saude_indigena.controller;

import com.saude_indigena.dto.*;
import com.saude_indigena.model.Vacinacao;
import com.saude_indigena.model.mapper.VacinacaoMapper;
import com.saude_indigena.service.VacinacaoService;
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
@RequestMapping("/vacinacoes")
public class VacinacaoController {

    private final VacinacaoService vacinacaoService;

    private final VacinacaoMapper vacinacaoMapper;

    public VacinacaoController(VacinacaoService vacinacaoService, VacinacaoMapper vacinacaoMapper) {
        this.vacinacaoService = vacinacaoService;
        this.vacinacaoMapper = vacinacaoMapper;
    }

    @Operation(summary = "Registra uma vacinação.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Vacinação registrada.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @PostMapping("/registrar")
    public ResponseEntity<Object> registrar(@RequestBody VacinacaoRegistroDTO dados){
        Vacinacao vacinacao = this.vacinacaoService.registrar(dados);
        VacinacaoResponseDTO response = this.vacinacaoMapper.toVacinacaoResponseDTO(vacinacao);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequestUri().path("/").buildAndExpand(vacinacao.getId()).toUri();
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.VACINACAO_MSG_REGISTRADO, HttpStatus.CREATED, response, uri);
    }

    @Operation(summary = "Atualiza uma vacinação.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Vacinação atualizada.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @PutMapping("/{vacinacaoUuid}")
    public ResponseEntity<Object> atualizarVacina(@PathVariable UUID vacinacaoUuid, @RequestBody VacinacaoAtualizacaoDTO dados){
        Vacinacao vacinacao = this.vacinacaoService.atualizar(vacinacaoUuid, dados);
        VacinacaoResponseDTO response = this.vacinacaoMapper.toVacinacaoResponseDTO(vacinacao);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.VACINACAO_MSG_LOCALIZADA, HttpStatus.NO_CONTENT, response, null);
    }

    @Operation(summary = "Lista as vacinações.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de vacinações.",
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
        List<VacinacaoListagemDTO> lista = this.vacinacaoService.listar(pageable);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.VACINACAO_MSG_LISTA, HttpStatus.OK, lista, null);
    }

    @Operation(summary = "Busca uma vacinação.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vacinação.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @GetMapping("/{vacinacaoUuid}")
    public ResponseEntity<Object> buscarPorUuid(@PathVariable UUID vacinacaoUuid){
        Vacinacao vacinacao = this.vacinacaoService.buscarPorUuid(vacinacaoUuid);
        VacinacaoResponseDTO response = this.vacinacaoMapper.toVacinacaoResponseDTO(vacinacao);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.VACINACAO_MSG_LOCALIZADA, HttpStatus.OK, response, null);
    }

    @Operation(summary = "Remove uma vacinação.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Vacinação removida.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @DeleteMapping("/{vacinacaoUuid}")
    public ResponseEntity<Object> removerVacinacao(@PathVariable UUID vacinacaoUuid){
        this.vacinacaoService.remover(vacinacaoUuid);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.VACINACAO_MSG_REMOVIDA, HttpStatus.NO_CONTENT, null, null);
    }
}
