package com.saude_indigena.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {
    private final SecurityFilter securityFilter;

    public SecurityConfiguration(SecurityFilter securityFilter) {
        this.securityFilter = securityFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
//                .csrf(csrf -> csrf.disable())
//                .authorizeHttpRequests(auth -> auth
//                        .anyRequest().permitAll()
//                )
//                .build();
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        // Endpoints de autenticação (públicos)
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/admin/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/register").permitAll()
                        
                        // Endpoints que exigem ADMIN
                        .requestMatchers(HttpMethod.POST, "/usuario").hasAnyRole("ADMIN")
                                                
                        // Endpoints que USER e ADMIN podem acessar
                        .requestMatchers(HttpMethod.GET, "/usuario").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/usuario/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/vacina").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/vacina/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/pessoa").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/pessoa/buscar-por-cpf").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/pessoa/**").hasAnyRole("USER", "ADMIN")
                        
                        // Endpoints de vacinação
                        .requestMatchers(HttpMethod.POST, "/vacinacoes/registrar").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/vacinacoes/**").hasAnyRole("USER", "ADMIN")
                        
                        // Perfil do usuário
                        .requestMatchers(HttpMethod.GET, "/usuario/perfil").hasAnyRole("USER", "ADMIN")
                        
                        // Qualquer outra requisição precisa estar autenticada
                        .anyRequest().authenticated()
                        )
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)throws Exception{
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
