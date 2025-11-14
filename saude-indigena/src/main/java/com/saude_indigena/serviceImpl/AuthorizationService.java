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
        // ✅ CORRIGIDO: Buscar primeiro em Usuario, depois em Admin
        // Isso permite que usuários comuns façam login pelo /auth/login
        
        System.out.println("🔍 Buscando usuário: " + username);
        
        // Tentar buscar como Usuario primeiro
        UserDetails user = usuarioRepository.findByUsuario(username);
        if (user != null) {
            System.out.println("✅ Encontrado como USUARIO: " + username);
            return user;
        }
        
        // Se não encontrou, tentar buscar como Admin
        UserDetails admin = adminRepository.findByUsuario(username);
        if (admin != null) {
            System.out.println("✅ Encontrado como ADMIN: " + username);
            return admin;
        }

        // Se não encontrou em nenhuma tabela
        System.out.println("❌ Usuário não encontrado: " + username);
        throw new UsernameNotFoundException("Usuário não encontrado: " + username);
    }
}