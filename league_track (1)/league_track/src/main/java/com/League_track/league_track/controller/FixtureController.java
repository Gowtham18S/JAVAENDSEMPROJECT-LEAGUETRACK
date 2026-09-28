package com.League_track.league_track.controller;

import com.League_track.league_track.entity.Match;
import com.League_track.league_track.entity.Team;
import com.League_track.league_track.repository.MatchRepository;
import com.League_track.league_track.repository.TeamRepository;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/fixtures")
public class FixtureController {

    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    public FixtureController(TeamRepository teamRepository,
                             MatchRepository matchRepository) {
        this.teamRepository = teamRepository;
        this.matchRepository = matchRepository;
    }

    @PostMapping("/generate")
    public List<Match> generateFixtures() {

        List<Team> teams = teamRepository.findAll();

        // Get all matches that already exist
        List<Match> existingMatches = matchRepository.findAll();

        // Create only missing fixtures
        for (int i = 0; i < teams.size(); i++) {

            for (int j = i + 1; j < teams.size(); j++) {

                Team team1 = teams.get(i);
                Team team2 = teams.get(j);

                boolean alreadyExists = false;

                // Check whether this pair already has a match
                for (Match existingMatch : existingMatches) {

                    Long existingTeam1Id = existingMatch.getTeam1().getId();
                    Long existingTeam2Id = existingMatch.getTeam2().getId();

                    boolean sameOrder =
                            existingTeam1Id.equals(team1.getId())
                                    && existingTeam2Id.equals(team2.getId());

                    boolean reverseOrder =
                            existingTeam1Id.equals(team2.getId())
                                    && existingTeam2Id.equals(team1.getId());

                    if (sameOrder || reverseOrder) {
                        alreadyExists = true;
                        break;
                    }
                }

                // Create fixture only if it doesn't already exist
                if (!alreadyExists) {

                    Match match = new Match();

                    match.setTeam1(team1);
                    match.setTeam2(team2);

                    // Match has not been played yet
                    match.setTeam1Score(null);
                    match.setTeam2Score(null);

                    matchRepository.save(match);

                    // Add it to existingMatches so it won't be duplicated
                    // during this same request
                    existingMatches.add(match);
                }
            }
        }

        // Return all fixtures
        return matchRepository.findAll();
    }
}