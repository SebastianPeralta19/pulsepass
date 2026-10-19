package com.pulsepass.service;

import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.dto.response.AuthenticatedUserResponse;
import com.pulsepass.dto.response.UserResponse;

/**
 * Orquesta autenticación y registro de credenciales. No reemplaza las reglas de
 * negocio de UserService ni de los demás Services.
 */
public interface AuthService {

    /**
     * Crea User + perfil + credencial BCrypt + ROLE_USER de forma atómica.
     * Nunca otorga STAFF ni ADMIN desde el registro público.
     */
    UserResponse register(RegisterUserRequest request);

    /** Autentica usuario o correo + contraseña y emite el token de acceso. */
    AuthResponse login(LoginRequest request);

    /** Información mínima del usuario autenticado, sin secretos. */
    AuthenticatedUserResponse currentUser();
}
