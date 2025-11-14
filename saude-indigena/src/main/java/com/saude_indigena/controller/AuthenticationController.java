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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
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
        try {
            System.out.println("🔐 Tentativa de login - Usuário: " + data.usuario());
            
            var usernamePassword = new UsernamePasswordAuthenticationToken(data.usuario(), data.password());
            Authentication auth = this.authenticationManager.authenticate(usernamePassword);
            
            System.out.println("✅ Autenticação bem-sucedida");
            System.out.println("👤 Principal: " + auth.getPrincipal().getClass().getName());
            
            // ✅ CORRIGIDO: Verificar se é Usuario ou Admin
            String token;
            if (auth.getPrincipal() instanceof Usuario) {
                token = tokenService.generateToken((Usuario) auth.getPrincipal());
                System.out.println("✅ Token gerado para USUARIO");
            } else if (auth.getPrincipal() instanceof Admin) {
                token = tokenService.generateToken((Admin) auth.getPrincipal());
                System.out.println("✅ Token gerado para ADMIN");
            } else {
                System.out.println("❌ Tipo de principal desconhecido: " + auth.getPrincipal().getClass().getName());
                return ResponseApi.erroResponse(TipoResponseApi.ERROR, "Erro ao gerar token", HttpStatus.INTERNAL_SERVER_ERROR, "Tipo de usuário não reconhecido", null);
            }

            LoginResponseDTO response = new LoginResponseDTO(token);
            return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.USUARIO_MSG_LOGADO, HttpStatus.OK, response, null);
            
        } catch (AuthenticationException e) {
            System.out.println("❌ Falha na autenticação: " + e.getMessage());
            return ResponseApi.erroResponse(TipoResponseApi.ERROR, "Usuário ou senha inválidos", HttpStatus.UNAUTHORIZED, e.getMessage(), null);
        } catch (Exception e) {
            System.out.println("❌ Erro interno: " + e.getMessage());
            e.printStackTrace();
            return ResponseApi.erroResponse(TipoResponseApi.ERROR, "Erro ao processar login", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), null);
        }
    }

    @PostMapping("/admin/login")
    public ResponseEntity loginAdmin(@RequestBody @Valid AuthenticationAdminDTO data) {
        try {
            System.out.println("🔐 Tentativa de login ADMIN - Usuário: " + data.usuario());
            
            var usernamePassword = new UsernamePasswordAuthenticationToken(data.usuario(), data.password());
            Authentication auth = this.authenticationManager.authenticate(usernamePassword);
            
            System.out.println("✅ Autenticação ADMIN bem-sucedida");
            
            // ✅ CORRIGIDO: Verificar se realmente é Admin
            if (!(auth.getPrincipal() instanceof Admin)) {
                System.out.println("❌ Usuário não é ADMIN");
                return ResponseApi.erroResponse(TipoResponseApi.ERROR, "Acesso negado", HttpStatus.FORBIDDEN, "Este endpoint é apenas para administradores", null);
            }

            var token = tokenService.generateToken((Admin) auth.getPrincipal());
            System.out.println("✅ Token gerado para ADMIN");

            LoginResponseDTO response = new LoginResponseDTO(token);
            return ResponseApi.crudResponse(TipoResponseApi.INFO, Constantes.ADMIN_MSG_LOGADO, HttpStatus.OK, response, null);
            
        } catch (AuthenticationException e) {
            System.out.println("❌ Falha na autenticação ADMIN: " + e.getMessage());
            return ResponseApi.erroResponse(TipoResponseApi.ERROR, "Usuário ou senha inválidos", HttpStatus.UNAUTHORIZED, e.getMessage(), null);
        } catch (Exception e) {
            System.out.println("❌ Erro interno no login ADMIN: " + e.getMessage());
            e.printStackTrace();
            return ResponseApi.erroResponse(TipoResponseApi.ERROR, "Erro ao processar login", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), null);
        }
    }

    @PostMapping("/register")
    public ResponseEntity register(@RequestBody @Valid RegisterDTO data) {
        try {
            System.out.println("📝 Tentativa de registro - Usuário: " + data.usuario());
            
            // Verificar se já existe
            if (this.adminRepository.findByUsuario(data.usuario()) != null) {
                System.out.println("❌ Admin já existe: " + data.usuario());
                return ResponseApi.erroResponse(TipoResponseApi.WARNING, "Usuário já existe", HttpStatus.BAD_REQUEST, "Este nome de usuário já está em uso", null);
            }
            
            // Criar admin
            String encryptedPassword = new BCryptPasswordEncoder().encode(data.password());
            Admin admin = new Admin(data.usuario(), encryptedPassword, data.role());
            
            this.adminRepository.save(admin);
            System.out.println("✅ Admin criado com sucesso: " + data.usuario());

            return ResponseApi.crudResponse(TipoResponseApi.INFO, "Admin criado com sucesso", HttpStatus.CREATED, null, null);
            
        } catch (Exception e) {
            System.out.println("❌ Erro ao criar admin: " + e.getMessage());
            e.printStackTrace();
            return ResponseApi.erroResponse(TipoResponseApi.ERROR, "Erro ao criar admin", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage(), null);
        }
    }
}