package com.League_track.league_track.repository;

import com.League_track.league_track.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRepository extends JpaRepository<Match, Long> {
}