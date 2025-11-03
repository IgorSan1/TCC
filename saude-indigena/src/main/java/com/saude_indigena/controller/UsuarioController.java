package com.saude_indigena.controller;

import com.saude_indigena.dto.*;
import com.saude_indigena.model.Pessoa;
import com.saude_indigena.model.Usuario;
import com.saude_indigena.model.mapper.UsuarioMapper;
import com.saude_indigena.service.UsuarioService;
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
@RequestMapping("/usuario")
public class UsuarioController {

    private final UsuarioService usuarioService;

    private final UsuarioMapper usuarioMapper;

    public UsuarioController(UsuarioService usuarioService, UsuarioMapper usuarioMapper) {
        this.usuarioService = usuarioService;
        this.usuarioMapper = usuarioMapper;
    }

    @Operation(summary = "Adiciona um usuario.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usuario adicionado.",
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
    public ResponseEntity<Object> adicionar(@RequestBody UsuarioCadastroDTO dados){
        Usuario usuario = this.usuarioService.adicionar(new Usuario(dados));
        UsuarioResponseDTO inspetorResponseDTO = this.usuarioMapper.toUsuarioResponseDTO(usuario);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequestUri().path("/").buildAndExpand(usuario.getId()).toUri();
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.USUARIO_MSG_ADICIONADO, HttpStatus.CREATED, inspetorResponseDTO, uri);
    }

    @Operation(summary = "Atualiza um usuario.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usuario atualizada.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @PutMapping("/{usuarioUuid}")
    public ResponseEntity<Object> atualizar(@PathVariable UUID usuarioUuid, @RequestBody UsuarioAtualizacaoDTO dados){
        Usuario usuario = this.usuarioService.atualizar(usuarioUuid, dados);
        UsuarioResponseDTO response = this.usuarioMapper.toUsuarioResponseDTO(usuario);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.USUARIO_MSG_LOCALIZADA, HttpStatus.NO_CONTENT, response, null);
    }

    @Operation(summary = "Busca um usuario.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuario.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @GetMapping("/{usuarioUuid}")
    public ResponseEntity<Object> buscarPorUuid(@PathVariable UUID usuarioUuid) {
        Usuario usuario = this.usuarioService.buscarPorUuid(usuarioUuid);
        UsuarioResponseDTO response = this.usuarioMapper.toUsuarioResponseDTO(usuario);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.USUARIO_MSG_LOCALIZADA, HttpStatus.OK, response, null);
    }

    @Operation(summary = "Lista os usuarios.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de usuarios.",
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
        List<UsuarioListagemDTO> lista = this.usuarioService.listar(pageable);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.USUARIO_MSG_LISTA, HttpStatus.OK, lista, null);
    }

    @Operation(summary = "Remove um usuario.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usuario removido.",
                    content = {
                            @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = ResponseApi.class))
                    }),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos."),
            @ApiResponse(responseCode = "401", description = "Não autorizado."),
            @ApiResponse(responseCode = "403", description = "Acesso proibido."),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor.")
    })
    @DeleteMapping("/{usuarioUuid}")
    public ResponseEntity<Object> removerPessoa(@PathVariable UUID usuarioUuid) {
        this.usuarioService.remover(usuarioUuid);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.USUARIO_MSG_REMOVIDA, HttpStatus.NO_CONTENT, null, null);
    }
}
