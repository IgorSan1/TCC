package com.saude_indigena.controller;

import com.saude_indigena.dto.AuthenticationAdminDTO;
import com.saude_indigena.dto.AuthenticationDTO;
import com.saude_indigena.dto.LoginResponseDTO;
import com.saude_indigena.dto.RegisterDTO;
import com.saude_indigena.model.Admin;
import com.saude_indigena.model.Usuario;
import com.saude_indigena.repository.AdminRepository;
import com.saude_indigena.repository.UsuarioRepository;
import com.saude_indigena.serviceImpl.TokenService;
import com.saude_indigena.util.Constantes;
import com.saude_indigena.util.ResponseApi;
import com.saude_indigena.util.TipoResponseApi;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("auth")
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;

    private final UsuarioRepository usuarioRepository;

    private final TokenService tokenService;

    private final AdminRepository adminRepository;

    public AuthenticationController(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository, TokenService tokenService, AdminRepository adminRepository) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.tokenService = tokenService;
        this.adminRepository = adminRepository;
    }

    @PostMapping("/login")
    public ResponseEntity login(@RequestBody @Valid AuthenticationDTO data) {
        var usernamePassword = new UsernamePasswordAuthenticationToken(data.usuario(), data.password());
        var auth = this.authenticationManager.authenticate(usernamePassword);

        var token = tokenService.generateToken((Usuario) auth.getPrincipal());

        //return ResponseEntity.ok(new LoginResponseDTO(token));
        LoginResponseDTO response = new LoginResponseDTO(token);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.USUARIO_MSG_LOGADO, HttpStatus.OK, response, null);
    }

    @PostMapping("/admin/login")
    public ResponseEntity loginAdmin(@RequestBody @Valid AuthenticationAdminDTO data) {
        var usernamePassword = new UsernamePasswordAuthenticationToken(data.usuario(), data.password());
        var auth = this.authenticationManager.authenticate(usernamePassword);

        var token = tokenService.generateToken((Admin) auth.getPrincipal());

        //return ResponseEntity.ok(new LoginResponseDTO(token));
        LoginResponseDTO response = new LoginResponseDTO(token);
        return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.ADMIN_MSG_LOGADO, HttpStatus.OK,response, null);
    }

    @PostMapping("/register")
    public ResponseEntity register(@RequestBody @Valid RegisterDTO data) {
        if (this.adminRepository.findByUsuario(data.usuario()) != null) {
            return ResponseEntity.badRequest().build();
        }
        String encryptedPassword = new BCryptPasswordEncoder().encode(data.password());
        Admin admin = new Admin(data.usuario(), encryptedPassword, data.role());

        this.adminRepository.save(admin);

        return ResponseEntity.ok().build();
    }
}
