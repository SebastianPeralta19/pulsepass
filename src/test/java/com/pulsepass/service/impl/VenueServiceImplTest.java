package com.pulsepass.service.impl;

import com.pulsepass.domain.Venue;
import com.pulsepass.dto.response.VenueResponse;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.VenueMapper;
import com.pulsepass.repository.VenueRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VenueServiceImplTest {

    @Mock
    private VenueRepository venueRepository;
    @Mock
    private VenueMapper venueMapper;
    @InjectMocks
    private VenueServiceImpl service;

    private final Venue venue = new Venue("VEN-SMR-01", "Marina Convention Center",
            "Santa Marta", "Calle 1", 3, true);
    private final VenueResponse response = new VenueResponse(1L, "VEN-SMR-01",
            "Marina Convention Center", "Santa Marta", "Calle 1", 3, true);

    @Test
    void findByCode_existingVenue_returnsDto() {
        // ARRANGE
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue));
        when(venueMapper.toResponse(venue)).thenReturn(response);

        // ACT
        VenueResponse result = service.findByCode("VEN-SMR-01");

        // ASSERT
        assertThat(result).isEqualTo(response);
    }

    @Test
    void findByCode_missingVenue_throwsNotFound() {
        // ARRANGE
        when(venueRepository.findByCode("X")).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.findByCode("X"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("X");
    }

    @Test
    void findActiveVenues_usesActiveQueryAndMapsResults() {
        // ARRANGE
        when(venueRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(venue));
        when(venueMapper.toResponse(any(Venue.class))).thenReturn(response);

        // ACT
        List<VenueResponse> result = service.findActiveVenues();

        // ASSERT
        assertThat(result).containsExactly(response);
        verify(venueRepository).findByActiveTrueOrderByNameAsc();
    }
}
