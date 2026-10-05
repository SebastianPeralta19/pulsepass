package com.pulsepass.repository;

import com.pulsepass.domain.Event;
import com.pulsepass.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    Optional<Event> findByEventCode(String eventCode);

    boolean existsByEventCode(String eventCode);

    List<Event> findByStatusOrderByEventDateAsc(EventStatus status);

    List<Event> findByVenueCode(String venueCode);

    // FR-SRC-001: eventos donde participa un artista por stageName
    @Query("""
            SELECT DISTINCT e FROM Event e
            JOIN e.artists a
            WHERE a.stageName = :stageName
            """)
    List<Event> findByArtistStageName(@Param("stageName") String stageName);

    // FR-SRC-002: eventos de una ciudad en los que participa un artista especifico
    @Query("""
            SELECT DISTINCT e FROM Event e
            JOIN e.artists a
            WHERE e.venue.city = :city
            AND a.stageName = :stageName
            """)
    List<Event> findByVenueCityAndArtistStageName(@Param("city") String city,
                                                  @Param("stageName") String stageName);

    // FR-SRC-003: eventos publicados posteriores a una fecha, en una ciudad,
    // cuyo artista contenga un texto (case-insensitive), sin duplicados, ordenados por fecha
    @Query("""
            SELECT DISTINCT e FROM Event e
            JOIN e.artists a
            WHERE e.status = com.pulsepass.enums.EventStatus.PUBLISHED
            AND e.eventDate > :afterDate
            AND e.venue.city = :city
            AND LOWER(a.stageName) LIKE LOWER(CONCAT('%', :artistText, '%'))
            ORDER BY e.eventDate ASC
            """)
    List<Event> findRecommendedEvents(@Param("afterDate") LocalDateTime afterDate,
                                      @Param("city") String city,
                                      @Param("artistText") String artistText);
}