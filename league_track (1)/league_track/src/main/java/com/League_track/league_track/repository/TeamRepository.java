package com.League_track.league_track.repository;

import com.League_track.league_track.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {
}