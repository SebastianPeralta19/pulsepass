package com.pulsepass.service.impl;

import com.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.ArtistMapper;
import com.pulsepass.repository.ArtistRepository;
import com.pulsepass.service.ArtistService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ArtistServiceImpl implements ArtistService {

    private final ArtistRepository artistRepository;
    private final ArtistMapper artistMapper;

    public ArtistServiceImpl(ArtistRepository artistRepository, ArtistMapper artistMapper) {
        this.artistRepository = artistRepository;
        this.artistMapper = artistMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public ArtistResponse findById(Long id) {
        return artistRepository.findById(id)
                .map(artistMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public ArtistResponse findByStageName(String stageName) {
        return artistRepository.findByStageNameIgnoreCase(stageName)
                .map(artistMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found: " + stageName));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArtistResponse> findActiveArtists() {
        return artistRepository.findByActiveTrueOrderByStageNameAsc()
                .stream()
                .map(artistMapper::toResponse)
                .toList();
    }
}
