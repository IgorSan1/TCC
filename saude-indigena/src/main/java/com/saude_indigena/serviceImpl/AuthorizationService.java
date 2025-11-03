package com.saude_indigena.serviceImpl;

import com.saude_indigena.repository.AdminRepository;
import com.saude_indigena.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService implements UserDetailsService {

    private final AdminRepository adminRepository;

    private final UsuarioRepository usuarioRepository;

    public AuthorizationService(AdminRepository adminRepository, UsuarioRepository usuarioRepository) {
        this.adminRepository = adminRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDetails admin = adminRepository.findByUsuario(username);
        if (admin != null) {
            return admin;
        }

        UserDetails user = usuarioRepository.findByUsuario(username);
        if (user != null) {
            return user;
        }

        throw new UsernameNotFoundException("Usuário não encontrado: " + username);
    }
}
