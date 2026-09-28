package com.League_track.league_track.controller;

import com.League_track.league_track.entity.Team;
import com.League_track.league_track.repository.TeamRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamRepository teamRepository;

    public TeamController(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    // CREATE TEAM
    @PostMapping
    public Team createTeam(@RequestBody Team team) {
        return teamRepository.save(team);
    }

    // GET ALL TEAMS
    @GetMapping
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    // GET TEAM BY ID
    @GetMapping("/{id}")
    public Team getTeamById(@PathVariable Long id) {
        return teamRepository.findById(id)
                .orElseThrow();
    }

    // GET LEAGUE STANDINGS
    @GetMapping("/standings")
    public List<Team> getStandings() {
        return teamRepository.findAll();
    }
}