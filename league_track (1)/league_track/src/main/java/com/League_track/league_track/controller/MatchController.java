package com.League_track.league_track.controller;

import com.League_track.league_track.entity.Match;
import com.League_track.league_track.entity.Team;
import com.League_track.league_track.repository.MatchRepository;
import com.League_track.league_track.repository.TeamRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchRepository matchRepository;
    private final TeamRepository teamRepository;

    public MatchController(MatchRepository matchRepository,
                           TeamRepository teamRepository) {
        this.matchRepository = matchRepository;
        this.teamRepository = teamRepository;
    }

    // CREATE MATCH
    @PostMapping
    public Match createMatch(@RequestBody Match match) {

        Team team1 = teamRepository.findById(match.getTeam1().getId())
                .orElseThrow();

        Team team2 = teamRepository.findById(match.getTeam2().getId())
                .orElseThrow();

        match.setTeam1(team1);
        match.setTeam2(team2);

        calculateWinner(match);

        updateTeamStats(match);

        return matchRepository.save(match);
    }

    // GET ALL MATCHES
    @GetMapping
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    // GET MATCH BY ID
    @GetMapping("/{id}")
    public Match getMatchById(@PathVariable Long id) {
        return matchRepository.findById(id)
                .orElseThrow();
    }

    // UPDATE MATCH
    @PutMapping("/{id}")
    public Match updateMatch(@PathVariable Long id,
                             @RequestBody Match updatedMatch) {

        Match existingMatch = matchRepository.findById(id)
                .orElseThrow();

        existingMatch.setTeam1Score(updatedMatch.getTeam1Score());
        existingMatch.setTeam2Score(updatedMatch.getTeam2Score());

        calculateWinner(existingMatch);

        updateTeamStats(existingMatch);

        return matchRepository.save(existingMatch);
    }

    // CALCULATE WINNER
    private void calculateWinner(Match match) {

        if (match.getTeam1Score() > match.getTeam2Score()) {

            match.setWinner(match.getTeam1().getName());

        } else if (match.getTeam2Score() > match.getTeam1Score()) {

            match.setWinner(match.getTeam2().getName());

        } else {

            match.setWinner("Tie");
        }
    }

    // UPDATE TEAM STATISTICS
    private void updateTeamStats(Match match) {

        Team team1 = match.getTeam1();
        Team team2 = match.getTeam2();

        team1.setPlayed(team1.getPlayed() + 1);
        team2.setPlayed(team2.getPlayed() + 1);

        if (match.getWinner().equals(team1.getName())) {

            team1.setWon(team1.getWon() + 1);
            team1.setPoints(team1.getPoints() + 2);

            team2.setLost(team2.getLost() + 1);

        } else if (match.getWinner().equals(team2.getName())) {

            team2.setWon(team2.getWon() + 1);
            team2.setPoints(team2.getPoints() + 2);

            team1.setLost(team1.getLost() + 1);
        }

        teamRepository.save(team1);
        teamRepository.save(team2);
    }
}