package com.pulsepass.service.impl;

import com.pulsepass.domain.User;
import com.pulsepass.domain.UserProfile;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.UserMapper;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.AuthorizationService;
import com.pulsepass.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Locale;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final AuthorizationService authorizationService;
    private final Clock clock;

    public UserServiceImpl(UserRepository userRepository,
                           UserMapper userMapper,
                           AuthorizationService authorizationService,
                           Clock clock) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.authorizationService = authorizationService;
        this.clock = clock;
    }

    /**
     * Crea User + UserProfile en la misma transacción: el perfil se persiste
     * por cascade (CascadeType.ALL en User.profile).
     */
    @Override
    @Transactional
    public UserResponse register(RegisterUserRequest request) {
        validateRegisterRequest(request);

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username already exists: " + request.username());
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("Email already exists: " + email);
        }

        User user = new User(request.username(), email, true);
        user.setProfile(new UserProfile(
                request.firstName(),
                request.lastName(),
                request.phone(),
                request.city(),
                request.birthDate()));

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        authorizationService.requireSelfOrAdmin(user.getId());
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        authorizationService.requireSelfOrAdmin(user.getId());
        return userMapper.toResponse(user);
    }

    private void validateRegisterRequest(RegisterUserRequest request) {
        if (request == null) {
            throw new BusinessRuleException("Request is required.");
        }
        if (isBlank(request.username())) {
            throw new BusinessRuleException("Username is required.");
        }
        if (isBlank(request.email())) {
            throw new BusinessRuleException("Email is required.");
        }
        if (isBlank(request.firstName()) || isBlank(request.lastName())) {
            throw new BusinessRuleException("First name and last name are required.");
        }
        if (request.birthDate() != null && request.birthDate().isAfter(LocalDate.now(clock))) {
            throw new BusinessRuleException("Birth date cannot be in the future.");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
