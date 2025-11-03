package com.saude_indigena.excecoes;

import com.saude_indigena.util.ResponseApi;
import com.saude_indigena.util.TipoResponseApi;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class ExcecaoHandler {

    @ExceptionHandler(ObjetoNaoEncontradoException.class)
    public ResponseEntity<Object> objetoNaoEncontrado(ObjetoNaoEncontradoException exception, HttpServletRequest request) {
        return ResponseApi.erroResponse(TipoResponseApi.WARNING, exception.getMessage(), HttpStatus.NOT_FOUND, null, request.getRequestURI());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> violacaoIntegridade(DataIntegrityViolationException exception, HttpServletRequest request) {
        String mensagem = "Erro na requisição";
        String detalhe = "Dados inválidos";
        
        if (exception.getMessage().contains("duplicate key")) {
            mensagem = "Registro em duplicidade";
            
            if (exception.getMessage().contains("cpf")) {
                detalhe = "CPF já cadastrado no sistema";
            } else if (exception.getMessage().contains("usuario")) {
                detalhe = "Nome de usuário já existe";
            } else if (exception.getMessage().contains("email")) {
                detalhe = "Email já cadastrado no sistema";
            }
        }
        
        log.error("Violação de integridade: {}", exception.getMessage());
        return ResponseApi.erroResponse(TipoResponseApi.ERROR, mensagem, HttpStatus.BAD_REQUEST, detalhe, request.getRequestURI());
    }

    @ExceptionHandler(ValidacaoException.class)
    public ResponseEntity<Object> validacao(ValidacaoException exception, HttpServletRequest request) {
        log.warn("Erro de validação: {}", exception.getMessage());
        return ResponseApi.erroResponse(TipoResponseApi.WARNING, "Falha de validação", HttpStatus.BAD_REQUEST, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> argumentoInvalido(MethodArgumentNotValidException exception, HttpServletRequest request) {
        Map<String, String> erros = new HashMap<>();
        exception.getBindingResult().getAllErrors().forEach((error) -> {
            String nomeCampo = ((FieldError) error).getField();
            String mensagemErro = error.getDefaultMessage();
            erros.put(nomeCampo, mensagemErro);
        });
        
        log.warn("Argumentos inválidos: {}", erros);
        return ResponseApi.erroResponse(TipoResponseApi.WARNING, "Dados inválidos no formulário", HttpStatus.BAD_REQUEST, erros, request.getRequestURI());
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Object> nulo(NullPointerException exception, HttpServletRequest request) {
        log.error("Erro de valor nulo: {}", exception.getMessage());
        return ResponseApi.erroResponse(TipoResponseApi.ERROR, "Erro de valor nulo", HttpStatus.BAD_REQUEST, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> excecao(Exception exception, HttpServletRequest request) {
        log.error("Falha ao processar a requisição: {} ao chamar a URL {}", exception.getMessage(), request.getRequestURI());
        exception.printStackTrace(); // Para debug
        return ResponseApi.erroResponse(TipoResponseApi.ERROR, "Falha ao processar a requisição. Entre em contato com o suporte.", HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage(), request.getRequestURI());
    }
}