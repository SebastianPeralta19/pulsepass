package com.pulsepass.service.impl;

import com.pulsepass.domain.User;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.UserMapper;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.AuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-05T10:00:00Z"), ZoneOffset.UTC);

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private AuthorizationService authorizationService;

    private UserServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserServiceImpl(userRepository, userMapper, authorizationService, CLOCK);
    }

    private static RegisterUserRequest request(LocalDate birthDate) {
        return new RegisterUserRequest("andrea", "Andrea@Email.com", "clave-segura-123", "Andrea", "Perez",
                "3001234567", "Santa Marta", birthDate);
    }

    private static UserResponse responseOf(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.isActive(),
                u.getProfile().getFirstName(), u.getProfile().getLastName(), u.getProfile().getPhone(),
                u.getProfile().getCity(), u.getProfile().getBirthDate());
    }

    @Test
    void register_validUser_savesActiveUserWithProfile() {
        // ARRANGE
        when(userRepository.save(any(User.class))).then(returnsFirstArg());
        when(userMapper.toResponse(any(User.class))).thenAnswer(inv -> responseOf(inv.getArgument(0)));

        // ACT
        UserResponse result = service.register(request(LocalDate.of(2001, 1, 10)));

        // ASSERT
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.isActive()).isTrue();
        assertThat(saved.getEmail()).isEqualTo("andrea@email.com");
        assertThat(saved.getProfile()).isNotNull();
        assertThat(saved.getProfile().getUser()).isSameAs(saved);
        assertThat(saved.getProfile().getBirthDate()).isEqualTo(LocalDate.of(2001, 1, 10));
        assertThat(result.active()).isTrue();
    }

    @Test
    void register_duplicatedUsername_throwsDuplicate() {
        // ARRANGE
        when(userRepository.existsByUsername("andrea")).thenReturn(true);

        // ACT + ASSERT
        assertThatThrownBy(() -> service.register(request(LocalDate.of(2001, 1, 10))))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Username");
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_duplicatedEmailIgnoringCase_throwsDuplicate() {
        // ARRANGE
        when(userRepository.existsByEmailIgnoreCase("andrea@email.com")).thenReturn(true);

        // ACT + ASSERT
        assertThatThrownBy(() -> service.register(request(LocalDate.of(2001, 1, 10))))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email");
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_futureBirthDate_throwsBusinessRule() {
        // ACT + ASSERT
        assertThatThrownBy(() -> service.register(request(LocalDate.of(2027, 1, 1))))
                .isInstanceOf(BusinessRuleException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_missingUsername_throwsBusinessRule() {
        // ARRANGE
        RegisterUserRequest invalid = new RegisterUserRequest(
                " ", "a@email.com", "clave-segura-123", "A", "B", null, null, null);

        // ACT + ASSERT
        assertThatThrownBy(() -> service.register(invalid))
                .isInstanceOf(BusinessRuleException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void findByEmail_existing_returnsDto() {
        // ARRANGE
        User user = new User("andrea", "andrea@email.com", true);
        UserResponse response = new UserResponse(1L, "andrea", "andrea@email.com", true,
                "Andrea", "Perez", null, null, null);
        when(userRepository.findByEmailIgnoreCase("ANDREA@email.com")).thenReturn(Optional.of(user));
        when(userMapper.toResponse(user)).thenReturn(response);

        // ACT + ASSERT
        assertThat(service.findByEmail("ANDREA@email.com")).isEqualTo(response);
    }

    @Test
    void findByUsername_missing_throwsNotFound() {
        // ARRANGE
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.findByUsername("ghost"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
