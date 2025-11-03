package com.saude_indigena.util;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class ResponseApi {

    public static ResponseEntity<Object> crudResponse(TipoResponseApi tipoResponseApi, String mensagem, HttpStatus status, Object dados, URI path) {
        Map<String, Object> map = new HashMap<>();
        map.put("tipo", tipoResponseApi);
        map.put("mensagem", mensagem);
        map.put("status", status.value());
        map.put("instante", LocalDateTime.now());
        if (path != null) {
            map.put("path", path);
        }
        if (dados != null) {
            map.put("dados", Arrays.asList(dados));
        } else {
            map.put("dados", null);
        }
        return new ResponseEntity<>(map, status);
    }

    public static ResponseEntity<Object> erroResponse(TipoResponseApi tipoResponseApi, String mensagem, HttpStatus status, Object erros, String path) {
        Map<String, Object> map = new HashMap<>();
        map.put("tipo", tipoResponseApi);
        map.put("mensagem", mensagem);
        map.put("status", status.value());
        map.put("instante", LocalDateTime.now());
        if (erros == null) {
            map.put("erros", null);
        } else {
            map.put("erros", Arrays.asList(erros));
        }
        if (path != null) {
            map.put("path", path);
        }
        return new ResponseEntity<>(map, status);
    }
}
