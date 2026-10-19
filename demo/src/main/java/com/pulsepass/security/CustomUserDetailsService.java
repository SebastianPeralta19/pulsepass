package com.pulsepass.security;

import com.pulsepass.domain.User;
import com.pulsepass.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Carga la identidad de autenticación desde persistencia (usuario, credencial
 * y roles). No valida reglas comerciales.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user = userRepository.findPrincipalByIdentifier(identifier)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return toPrincipal(user);
    }

    /**
     * Reconstruye el principal a partir del id persistente del token. Cada
     * request vuelve a consultar estado y roles vigentes.
     */
    public UserPrincipal loadUserById(Long userId) throws UsernameNotFoundException {
        return userRepository.findPrincipalById(userId)
                .map(this::toPrincipal)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private UserPrincipal toPrincipal(User user) {
        if (user.getCredential() == null) {
            // Los usuarios legados sin credenciales no pueden iniciar sesión.
            throw new UsernameNotFoundException("User has no credentials");
        }
        return UserPrincipal.from(user);
    }
}
