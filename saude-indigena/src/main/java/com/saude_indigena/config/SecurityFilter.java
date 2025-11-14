package com.saude_indigena.config;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.saude_indigena.repository.AdminRepository;
import com.saude_indigena.repository.UsuarioRepository;
import com.saude_indigena.serviceImpl.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class SecurityFilter extends OncePerRequestFilter {
    private final TokenService tokenService;
    private final AdminRepository adminRepository;
    private final UsuarioRepository usuarioRepository;

    @Value("${api.security.token.secret}")
    private String secret;

    public SecurityFilter(TokenService tokenService, AdminRepository adminRepository, UsuarioRepository usuarioRepository) {
        this.tokenService = tokenService;
        this.adminRepository = adminRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        var token = this.recoverToken(request);
        
        if (token != null) {
            try {
                DecodedJWT jwt = JWT.require(Algorithm.HMAC256(secret))
                        .withIssuer("auth-api")
                        .build()
                        .verify(token);

                String subject = jwt.getSubject();
                String role = jwt.getClaim("role").asString();

                logger.info("🔐 Token validado - Usuário: " + subject + " | Role: " + role);

                UserDetails userDetails = null;

                // ✅ BUSCAR SEMPRE NA TABELA ADMIN PRIMEIRO (para admins criados via cadastro)
                userDetails = adminRepository.findByUsuario(subject);
                
                if (userDetails != null) {
                    logger.info("✅ Encontrado na tabela ADMIN: " + subject);
                } else {
                    // Se não encontrou em admin, buscar em usuario
                    userDetails = usuarioRepository.findByUsuario(subject);
                    
                    if (userDetails != null) {
                        logger.info("✅ Encontrado na tabela USUARIO: " + subject);
                    } else {
                        logger.error("❌ Usuário não encontrado em nenhuma tabela: " + subject);
                    }
                }

                // Se não encontrou o usuário, rejeitar
                if (userDetails == null) {
                    logger.error("❌ UserDetails é NULL - rejeitando requisição");
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Usuário não encontrado");
                    return;
                }

                // Criar autenticação com as authorities do UserDetails
                var authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                logger.info("✅ Autenticação configurada com authorities: " + userDetails.getAuthorities());

            } catch (JWTVerificationException e) {
                logger.error("❌ Token inválido: " + e.getMessage());
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token inválido");
                return;
            } catch (Exception e) {
                logger.error("❌ Erro ao processar token: " + e.getMessage());
                e.printStackTrace();
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Erro ao processar token");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }

    private String recoverToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null) {
            return null;
        }
        return authHeader.replace("Bearer ", "");
    }
}