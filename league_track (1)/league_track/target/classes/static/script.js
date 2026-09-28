/* =====================================================
   LEAGUE TRACK - DASHBOARD CONTROLLER & API INTEGRATION
   ===================================================== */

const API = "http://localhost:8080/api";

// Global App State
let globalTeams = [];
let globalMatches = [];
let currentMatchFilter = 'all';
let isGeneratingFixtures = false;

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
    await refreshAllData();
});

// Refresh all data from backend
async function refreshAllData() {
    await Promise.all([loadTeams(), loadMatches()]);
    renderParticipatingTeams();
    renderStandings();
    updateDashboardStats();
    renderFixturesPage();
    checkFixtureStatus();
}

// =====================================================
// PAGE NAVIGATION
// =====================================================
function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    pages.forEach(p => p.classList.remove("active-page"));

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add("active-page");
    }

    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => btn.classList.remove("active"));
    const activeNavBtn = document.getElementById(`nav-${pageId}`);
    if (activeNavBtn) {
        activeNavBtn.classList.add("active");
    }

    const titleEl = document.getElementById("pageTitle");
    const subtitleEl = document.getElementById("pageSubtitle");

    if (titleEl && subtitleEl) {
        switch (pageId) {
            case "dashboard":
                titleEl.textContent = "Dashboard";
                subtitleEl.textContent = "League Track sports tournament management";
                break;
            case "teams":
                titleEl.textContent = "Teams & Roster";
                subtitleEl.textContent = "View and manage participating tournament teams";
                break;
            case "matches":
                titleEl.textContent = "Fixtures & Matches";
                subtitleEl.textContent = "Full round-robin schedule and match management";
                break;
            case "standings":
                titleEl.textContent = "Standings";
                subtitleEl.textContent = "Official league table and win rate statistics";
                break;
        }
    }
}

// =====================================================
// LOAD TEAMS (GET /api/teams)
// =====================================================
async function loadTeams() {
    try {
        const response = await fetch(`${API}/teams`);
        if (!response.ok) {
            throw new Error(`Failed to fetch teams (${response.status})`);
        }
        globalTeams = await response.json();
        renderTeams();
        renderParticipatingTeams();
        updateTeamDropdowns();
        return globalTeams;
    } catch (error) {
        console.error("Error loading teams:", error);
        showToast("Error loading teams from backend.", "error");
        return [];
    }
}

// Render Participating Teams List on Dashboard & Fixtures Page
function renderParticipatingTeams() {
    const dashboardContainer = document.getElementById("participatingTeamsList");
    const fixturesContainer = document.getElementById("fixturesRegisteredTeamsList");

    const renderList = (container) => {
        if (!container) return;
        if (globalTeams.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No teams registered yet.</p>`;
        } else {
            container.innerHTML = globalTeams.map((team, idx) => `
                <div class="participating-team-item">
                    <span class="participating-team-idx">${idx + 1}</span>
                    <div style="display: flex; align-items: center; gap: 10px; width: 100%; justify-content: space-between;">
                        <span style="font-weight: 600; font-size: 0.95rem;">${escapeHtml(team.name)}</span>
                        <span class="team-id-badge" style="font-size: 0.75rem; padding: 3px 8px;">Team ID: ${team.id}</span>
                    </div>
                </div>
            `).join("");
        }
    };

    renderList(dashboardContainer);
    renderList(fixturesContainer);
}

// Render Teams Page (Attractive Detailed Team Cards)
function renderTeams() {
    const cardsGrid = document.getElementById("teamsCardsGrid");

    if (!cardsGrid) return;

    if (globalTeams.length === 0) {
        cardsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🛡️</div>
                <h4>No Teams Registered</h4>
                <p>Click "Add Team" to register your first college team in the league.</p>
            </div>
        `;
        return;
    }

    // Calculate team statistics dynamically from GET /api/matches
    cardsGrid.innerHTML = globalTeams.map(team => {
        const teamMatches = globalMatches.filter(m => m.team1?.id === team.id || m.team2?.id === team.id);
        const completedMatches = teamMatches.filter(m => m.team1Score !== null && m.team2Score !== null);
        const upcomingMatches = teamMatches.filter(m => m.team1Score === null || m.team2Score === null);

        const played = completedMatches.length;
        const won = completedMatches.filter(m => m.winner === team.name).length;
        const lost = Math.max(0, played - won);
        const points = team.points ?? (won * 2);
        const winRate = played > 0 ? Math.round((won / played) * 100) : 0;

        return `
            <div class="team-card">
                <div class="team-card-header">
                    <div class="team-avatar">🏆</div>
                    <div>
                        <h3 style="color: white; font-size: 1.15rem; font-weight: 700;">${escapeHtml(team.name)}</h3>
                        <span class="team-id-badge">Team ID: #${team.id}</span>
                    </div>
                </div>
                
                <div class="team-stats-row mt-4">
                    <div class="tstat-item">
                        <span>Played</span>
                        <strong>${played}</strong>
                    </div>
                    <div class="tstat-item">
                        <span>Won</span>
                        <strong>${won}</strong>
                    </div>
                    <div class="tstat-item">
                        <span>Lost</span>
                        <strong>${lost}</strong>
                    </div>
                </div>

                <div class="mt-4" style="display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 700;">
                    <span>Points: <strong style="color: var(--primary);">${points}</strong></span>
                    <span>Win Rate: <strong style="color: var(--success);">${winRate}%</strong></span>
                </div>

                <div class="mt-4" style="padding-top: 12px; border-top: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 6px; font-size: 0.82rem; color: var(--text-muted);">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Status:</span>
                        <span class="badge badge-success">ACTIVE</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Upcoming Matches:</span>
                        <strong style="color: white;">${upcomingMatches.length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Completed Matches:</span>
                        <strong style="color: white;">${completedMatches.length}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// =====================================================
// ADD TEAM (POST /api/teams)
// =====================================================
function openTeamForm() {
    const modal = document.getElementById("teamModal");
    if (modal) {
        modal.classList.add("active");
        const input = document.getElementById("teamName");
        if (input) {
            input.value = "";
            setTimeout(() => input.focus(), 100);
        }
    }
}

function closeTeamForm() {
    const modal = document.getElementById("teamModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

async function addTeam() {
    const input = document.getElementById("teamName");
    if (!input) return;

    const name = input.value.trim();
    if (!name) {
        showToast("Please enter a valid team name.", "warning");
        return;
    }

    try {
        const response = await fetch(`${API}/teams`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name })
        });

        if (!response.ok) {
            throw new Error(`Failed to create team (${response.status})`);
        }

        const newTeam = await response.json();
        showToast(`Team "${newTeam.name}" added successfully!`, "success");
        closeTeamForm();

        // Refresh all frontend data without full page reload
        await refreshAllData();

    } catch (error) {
        console.error("Error adding team:", error);
        showToast("Failed to add team. Make sure backend is running.", "error");
    }
}

// =====================================================
// LOAD MATCHES (GET /api/matches)
// =====================================================
async function loadMatches() {
    try {
        const response = await fetch(`${API}/matches`);
        if (!response.ok) {
            throw new Error(`Failed to fetch matches (${response.status})`);
        }
        globalMatches = await response.json();
        return globalMatches;
    } catch (error) {
        console.error("Error loading matches:", error);
        showToast("Error loading matches from backend.", "error");
        return [];
    }
}

// =====================================================
// RENDER FIXTURES & MATCHES PAGE
// =====================================================
function renderFixturesPage() {
    const hasMatches = globalMatches && globalMatches.length > 0;
    const sections = ["rrFixturesSection", "upcomingMatchesSection", "completedMatchesSection", "matchScheduleResultsSection"];
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = hasMatches ? "block" : "none";
        }
    });

    if (hasMatches) {
        renderRoundRobinSummaryAndRounds();
        renderUpcomingMatches();
        renderCompletedMatches();
        renderMatchScheduleAndResults();
    }
}

// Section 2: Round Robin Fixtures Table & Round Cards
function renderRoundRobinSummaryAndRounds() {
    const N = globalTeams.length;
    const summaryText = document.getElementById("rrSummaryText");
    const roundsContainer = document.getElementById("roundsContainer");
    const fixturesTableBody = document.getElementById("rrFixturesTableBody");

    const expectedTotalMatches = N >= 2 ? (N * (N - 1)) / 2 : 0;

    if (summaryText) {
        summaryText.textContent = `Total Teams: ${N} | Total Matches: ${expectedTotalMatches}`;
    }

    // Populate Fixture Table Body
    if (fixturesTableBody) {
        if (globalMatches.length === 0) {
            fixturesTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center" style="padding: 30px;">No fixtures generated yet. Click "Generate Round Robin" above.</td>
                </tr>
            `;
        } else {
            fixturesTableBody.innerHTML = globalMatches.map((match, idx) => {
                const team1Name = match.team1?.name || `Team ${match.team1?.id || '1'}`;
                const team2Name = match.team2?.name || `Team ${match.team2?.id || '2'}`;
                const isCompleted = match.team1Score !== null && match.team2Score !== null;
                const statusBadge = isCompleted ? `<span class="badge badge-success">COMPLETED</span>` : `<span class="badge badge-warning">UPCOMING</span>`;
                
                let resultText = "-";
                if (isCompleted) {
                    if (match.team1Score === match.team2Score) {
                        resultText = "Result: DRAW";
                    } else {
                        resultText = `${escapeHtml(match.winner || 'Winner')} won`;
                    }
                }

                return `
                    <tr>
                        <td><strong>Match ${idx + 1}</strong></td>
                        <td><strong>${escapeHtml(team1Name)}</strong></td>
                        <td><strong>${escapeHtml(team2Name)}</strong></td>
                        <td class="text-center">${statusBadge}</td>
                        <td class="text-center"><strong>${resultText}</strong></td>
                    </tr>
                `;
            }).join("");
        }
    }

    // Populate Rounds Cards
    if (roundsContainer) {
        if (N < 2 || globalMatches.length === 0) {
            roundsContainer.innerHTML = `
                <div class="empty-state" style="padding: 24px;">
                    <p style="color: var(--text-muted);">No round-robin schedule created yet. Click "Generate Round Robin" above.</p>
                </div>
            `;
            return;
        }

        const schedule = calculateFullRoundRobinSchedule(globalTeams);

        roundsContainer.innerHTML = schedule.rounds.map(rd => {
            return `
                <div class="round-card">
                    <div class="round-header">
                        <span class="round-title">ROUND ${rd.roundNum}</span>
                        <span class="badge badge-info">${rd.matches.length} Match${rd.matches.length === 1 ? '' : 'es'}</span>
                    </div>
                    <div class="round-matches-list" style="display: flex; flex-direction: column; gap: 8px;">
                        ${rd.matches.map(pair => {
                            const m = globalMatches.find(gm => {
                                const id1 = gm.team1?.id;
                                const id2 = gm.team2?.id;
                                return (id1 === pair.team1.id && id2 === pair.team2.id) ||
                                       (id1 === pair.team2.id && id2 === pair.team1.id);
                            });

                            const t1Name = pair.team1.name;
                            const t2Name = pair.team2.name;
                            const isCompleted = m && m.team1Score !== null && m.team2Score !== null;
                            
                            let statusOrScore = "Upcoming";
                            if (isCompleted) {
                                if (m.team1Score === m.team2Score) {
                                    statusOrScore = `${m.team1Score} - ${m.team2Score} (DRAW)`;
                                } else {
                                    statusOrScore = `${m.team1Score} - ${m.team2Score}`;
                                }
                            }

                            return `
                                <div class="round-match-row">
                                    <span class="round-match-teams">${escapeHtml(t1Name)} <span class="round-match-vs">vs</span> ${escapeHtml(t2Name)}</span>
                                    <span class="round-match-score" style="${isCompleted ? '' : 'font-size: 0.75rem; color: var(--text-dim);'}">${statusOrScore}</span>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            `;
        }).join("");
    }
}

// Section 3: Upcoming Matches
function renderUpcomingMatches() {
    const container = document.getElementById("upcomingMatchesList");
    if (!container) return;

    const upcoming = globalMatches.filter(m => m.team1Score === null || m.team2Score === null);

    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 20px;">
                <p style="color: var(--text-muted);">No upcoming matches.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = upcoming.map(match => {
        const team1Name = match.team1?.name || "Team 1";
        const team2Name = match.team2?.name || "Team 2";

        return `
            <div class="match-card">
                <div class="match-card-top">
                    <span class="match-id">Match #${match.id}</span>
                    <span class="badge badge-warning">UPCOMING</span>
                </div>
                <div class="match-teams-box">
                    <div class="m-team t-left">
                        <span class="m-name">${escapeHtml(team1Name)}</span>
                        <span class="m-score">-</span>
                    </div>
                    <div class="m-vs">VS</div>
                    <div class="m-team t-right">
                        <span class="m-name">${escapeHtml(team2Name)}</span>
                        <span class="m-score">-</span>
                    </div>
                </div>
                <div class="match-card-footer">
                    <span style="color: var(--text-muted); font-weight: 600;">Status: UPCOMING</span>
                    <button class="btn btn-secondary btn-xs" onclick="openUpdateScoreModal(${match.id})">Enter Result</button>
                </div>
            </div>
        `;
    }).join("");
}

// Section 4: Completed Matches
function renderCompletedMatches() {
    const container = document.getElementById("completedMatchesList");
    if (!container) return;

    const completed = globalMatches.filter(m => m.team1Score !== null && m.team2Score !== null);

    if (completed.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 20px;">
                <p style="color: var(--text-muted);">No completed matches yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = completed.map(match => {
        const team1Name = match.team1?.name || "Team 1";
        const team2Name = match.team2?.name || "Team 2";
        const isDraw = match.team1Score === match.team2Score;
        const winnerText = isDraw ? "Result: DRAW" : `Winner: ${escapeHtml(match.winner)}`;

        return `
            <div class="match-card">
                <div class="match-card-top">
                    <span class="match-id">Match #${match.id}</span>
                    <span class="badge badge-success">COMPLETED</span>
                </div>
                <div class="match-teams-box">
                    <div class="m-team t-left">
                        <span class="m-name">${escapeHtml(team1Name)}</span>
                        <span class="m-score">${match.team1Score}</span>
                    </div>
                    <div class="m-vs">VS</div>
                    <div class="m-team t-right">
                        <span class="m-name">${escapeHtml(team2Name)}</span>
                        <span class="m-score">${match.team2Score}</span>
                    </div>
                </div>
                <div class="match-card-footer">
                    <span style="color: var(--success); font-weight: 700;">${escapeHtml(winnerText)}</span>
                    <button class="btn btn-secondary btn-xs" onclick="openUpdateScoreModal(${match.id})">Edit Score</button>
                </div>
            </div>
        `;
    }).join("");
}

// Section 5: Match Schedule & Results (Bottom of Page)
function renderMatchScheduleAndResults() {
    const container = document.getElementById("matchResultsCardsList");
    if (!container) return;

    if (globalMatches.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 24px;">
                <p style="color: var(--text-muted);">No matches scheduled. Click "Generate Round Robin" above to create fixtures.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = globalMatches.map(m => {
        const team1Name = m.team1?.name || "Team 1";
        const team2Name = m.team2?.name || "Team 2";
        const isCompleted = m.team1Score !== null && m.team2Score !== null;
        
        return `
            <div class="score-card">
                <div class="score-card-header">
                    <span class="score-card-match-title">Match #${m.id}: ${escapeHtml(team1Name)} vs ${escapeHtml(team2Name)}</span>
                    <span class="badge ${isCompleted ? 'badge-success' : 'badge-warning'}">${isCompleted ? 'COMPLETED' : 'UPCOMING'}</span>
                </div>
                <div class="score-card-inputs">
                    <div class="score-input-group">
                        <label>${escapeHtml(team1Name)} Score</label>
                        <input type="number" id="inlineScore1_${m.id}" class="form-control" value="${m.team1Score !== null ? m.team1Score : ''}" placeholder="Enter score" min="0">
                    </div>
                    <div style="padding-top: 20px; font-weight: 800; color: var(--text-dim);">VS</div>
                    <div class="score-input-group">
                        <label>${escapeHtml(team2Name)} Score</label>
                        <input type="number" id="inlineScore2_${m.id}" class="form-control" value="${m.team2Score !== null ? m.team2Score : ''}" placeholder="Enter score" min="0">
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span style="font-size: 0.88rem; font-weight: 700; color: ${isCompleted ? 'var(--success)' : 'var(--text-muted)'};">
                        ${winnerTextFormat(m)}
                    </span>
                    <button class="btn btn-primary btn-sm" onclick="saveMatchResultInline(${m.id})">Save Result</button>
                </div>
            </div>
        `;
    }).join("");
}

function winnerTextFormat(match) {
    if (match.team1Score !== null && match.team2Score !== null) {
        if (match.team1Score === match.team2Score) {
            return "Result: DRAW";
        }
        return `Winner: ${escapeHtml(match.winner)}`;
    }
    return "Status: UPCOMING";
}

// Inline score saving from MATCH SCHEDULE & RESULTS section
async function saveMatchResultInline(matchId) {
    const score1Val = document.getElementById(`inlineScore1_${matchId}`)?.value;
    const score2Val = document.getElementById(`inlineScore2_${matchId}`)?.value;

    // Requirement: Score Validation
    if (score1Val === "" || score1Val === undefined || score2Val === "" || score2Val === undefined) {
        showToast("Please enter scores for both teams before saving.", "warning");
        alert("Please enter scores for both teams before saving.");
        return;
    }

    const team1Score = Number(score1Val);
    const team2Score = Number(score2Val);

    if (isNaN(team1Score) || isNaN(team2Score) || team1Score < 0 || team2Score < 0) {
        showToast("Scores must be valid non-negative numbers.", "warning");
        alert("Scores must be valid non-negative numbers.");
        return;
    }

    try {
        // Requirement: Use existing backend API PUT /api/matches/{id}
        const response = await fetch(`${API}/matches/${matchId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                team1Score: team1Score,
                team2Score: team2Score
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to update match (${response.status})`);
        }

        await response.json();
        showToast(`Match #${matchId} score saved successfully!`, "success");

        // Requirement: Automatic refresh after result without browser reload
        await refreshAllData();

    } catch (error) {
        console.error("Error saving match score:", error);
        showToast("Failed to save match result.", "error");
    }
}

// =====================================================
// UPDATE MATCH RESULT MODAL (PUT /api/matches/{id})
// =====================================================
function openUpdateScoreModal(matchId) {
    const match = globalMatches.find(m => m.id === matchId);
    if (!match) return;

    document.getElementById("updateMatchId").value = match.id;
    document.getElementById("updateTeam1Name").textContent = match.team1?.name || "Team 1";
    document.getElementById("updateTeam2Name").textContent = match.team2?.name || "Team 2";

    document.getElementById("lblTeam1Score").innerHTML = `${escapeHtml(match.team1?.name || "Team 1")} Score <span class="required">*</span>`;
    document.getElementById("lblTeam2Score").innerHTML = `${escapeHtml(match.team2?.name || "Team 2")} Score <span class="required">*</span>`;

    document.getElementById("updateTeam1Score").value = match.team1Score !== null && match.team1Score !== undefined ? match.team1Score : "";
    document.getElementById("updateTeam2Score").value = match.team2Score !== null && match.team2Score !== undefined ? match.team2Score : "";

    const modal = document.getElementById("updateScoreModal");
    if (modal) {
        modal.classList.add("active");
        setTimeout(() => document.getElementById("updateTeam1Score").focus(), 100);
    }
}

function closeUpdateScoreModal() {
    const modal = document.getElementById("updateScoreModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

async function submitMatchResult() {
    const matchId = document.getElementById("updateMatchId").value;
    const score1Val = document.getElementById("updateTeam1Score").value;
    const score2Val = document.getElementById("updateTeam2Score").value;

    if (score1Val === "" || score2Val === "") {
        showToast("Please enter valid numeric scores for both teams.", "warning");
        alert("Please enter valid numeric scores for both teams.");
        return;
    }

    const team1Score = Number(score1Val);
    const team2Score = Number(score2Val);

    if (isNaN(team1Score) || isNaN(team2Score) || team1Score < 0 || team2Score < 0) {
        showToast("Scores must be non-negative numbers.", "warning");
        alert("Scores must be non-negative numbers.");
        return;
    }

    try {
        const response = await fetch(`${API}/matches/${matchId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                team1Score: team1Score,
                team2Score: team2Score
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to update match (${response.status})`);
        }

        await response.json();
        showToast(`Match #${matchId} result updated successfully!`, "success");
        closeUpdateScoreModal();

        await refreshAllData();

    } catch (error) {
        console.error("Error updating match score:", error);
        showToast("Failed to update match score.", "error");
    }
}

// =====================================================
// CREATE SINGLE MANUAL MATCH (POST /api/matches)
// =====================================================
function openMatchForm() {
    updateTeamDropdowns();
    const modal = document.getElementById("matchModal");
    if (modal) {
        modal.classList.add("active");
    }
}

function closeMatchForm() {
    const modal = document.getElementById("matchModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

function updateTeamDropdowns() {
    const sel1 = document.getElementById("team1Select");
    const sel2 = document.getElementById("team2Select");

    if (!sel1 || !sel2) return;

    const buildOptions = () => {
        return `<option value="">-- Select Team --</option>` + 
            globalTeams.map(t => `<option value="${t.id}">${escapeHtml(t.name)} (ID: ${t.id})</option>`).join("");
    };

    sel1.innerHTML = buildOptions();
    sel2.innerHTML = buildOptions();
}

async function createMatch() {
    const team1Id = Number(document.getElementById("team1Select").value);
    const team2Id = Number(document.getElementById("team2Select").value);
    const s1Val = document.getElementById("team1Score").value;
    const s2Val = document.getElementById("team2Score").value;

    if (!team1Id || !team2Id) {
        showToast("Please select two distinct teams.", "warning");
        return;
    }

    if (team1Id === team2Id) {
        showToast("A team cannot play against itself.", "warning");
        return;
    }

    const team1Score = s1Val === "" ? null : Number(s1Val);
    const team2Score = s2Val === "" ? null : Number(s2Val);

    try {
        const response = await fetch(`${API}/matches`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                team1: { id: team1Id },
                team2: { id: team2Id },
                team1Score: team1Score,
                team2Score: team2Score
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to create match (${response.status})`);
        }

        showToast("Match created successfully!", "success");
        closeMatchForm();

        document.getElementById("team1Select").value = "";
        document.getElementById("team2Select").value = "";
        document.getElementById("team1Score").value = "";
        document.getElementById("team2Score").value = "";

        await refreshAllData();

    } catch (error) {
        console.error("Error creating match:", error);
        showToast("Failed to create match.", "error");
    }
}

// =====================================================
// FULL ROUND ROBIN GENERATION ALGORITHM
// Formula: Total Matches = N × (N - 1) / 2
// Handles both EVEN and ODD team counts with BYE scheduling
// =====================================================
async function generateRoundRobin() {
    if (isGeneratingFixtures) return;

    let teams = globalTeams;
    let matches = globalMatches;

    try {
        const [tRes, mRes] = await Promise.all([
            fetch(`${API}/teams`),
            fetch(`${API}/matches`)
        ]);
        if (tRes.ok) teams = await tRes.json();
        if (mRes.ok) matches = await mRes.json();
    } catch (e) {
        console.error("Error checking pre-fixture state:", e);
    }

    const N = teams.length;

    if (N < 2) {
        const msg = "At least 2 teams are required to generate a round-robin schedule.";
        showToast(msg, "warning");
        alert(msg);
        return;
    }

    // Calculate full round-robin schedule
    const schedule = calculateFullRoundRobinSchedule(teams);
    const missingPairs = [];

    schedule.rounds.forEach(rd => {
        rd.matches.forEach(pair => {
            const exists = matches.some(m => {
                const id1 = m.team1?.id;
                const id2 = m.team2?.id;
                return (id1 === pair.team1.id && id2 === pair.team2.id) ||
                       (id1 === pair.team2.id && id2 === pair.team1.id);
            });
            if (!exists) {
                missingPairs.push(pair);
            }
        });
    });

    if (missingPairs.length === 0) {
        disableGenerateButtons("Round Robin Generated ✓");
        showToast("Full round-robin fixtures already exist in backend!", "info");
        return;
    }

    isGeneratingFixtures = true;
    setGenerateButtonsLoading(`Generating ${missingPairs.length} Fixtures...`);

    let createdCount = 0;

    try {
        for (const pair of missingPairs) {
            const createResponse = await fetch(`${API}/matches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    team1: { id: pair.team1.id },
                    team2: { id: pair.team2.id },
                    team1Score: null,
                    team2Score: null
                })
            });

            if (createResponse.ok) {
                createdCount++;
            } else {
                console.error(`Failed to create fixture: ${pair.team1.name} vs ${pair.team2.name}`);
            }
        }

        await refreshAllData();
        disableGenerateButtons("Round Robin Generated ✓");
        showToast(`Successfully generated ${createdCount} round-robin fixtures!`, "success");

    } catch (error) {
        console.error("Error during fixture generation:", error);
        showToast("An error occurred while generating fixtures.", "error");
    } finally {
        isGeneratingFixtures = false;
    }
}

// Circle algorithm for Round Robin scheduling (even & odd team support)
function calculateFullRoundRobinSchedule(teamsList) {
    const N = teamsList.length;
    if (N < 2) return { rounds: [], totalMatches: 0, totalRounds: 0 };

    const isOdd = N % 2 !== 0;
    const list = [...teamsList];

    if (isOdd) {
        list.push({ id: -1, name: "BYE", isBye: true });
    }

    const numTeams = list.length; // even number
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const L = numTeams - 1;

    const rounds = [];
    let totalRealMatches = 0;

    for (let r = 0; r < numRounds; r++) {
        const roundMatches = [];

        // Match 0: center element list[0] vs list[1 + (r % L)]
        const t0 = list[0];
        const t1Idx = 1 + (r % L);
        const t1 = list[t1Idx];

        if (!t0.isBye && !t1.isBye) {
            roundMatches.push({ team1: t0, team2: t1 });
            totalRealMatches++;
        }

        // Chords across circle
        for (let k = 1; k < matchesPerRound; k++) {
            const idxA = 1 + ((r + k) % L);
            const idxB = 1 + ((r - k + L * 10) % L);
            const teamA = list[idxA];
            const teamB = list[idxB];

            if (!teamA.isBye && !teamB.isBye) {
                roundMatches.push({ team1: teamA, team2: teamB });
                totalRealMatches++;
            }
        }

        rounds.push({ roundNum: r + 1, matches: roundMatches });
    }

    return { rounds, totalMatches: totalRealMatches, totalRounds: numRounds };
}

// Check fixture status & update button states
function checkFixtureStatus() {
    const matchBtn = document.getElementById("matchesGenerateBtn");
    const N = globalTeams.length;

    if (N < 2) {
        updateGenerateBtnText(matchBtn, "Need at least 2 teams", true);
        return;
    }

    const targetTotal = (N * (N - 1)) / 2;
    
    // Count existing unique round-robin matches
    const schedule = calculateFullRoundRobinSchedule(globalTeams);
    let missingCount = 0;

    schedule.rounds.forEach(rd => {
        rd.matches.forEach(pair => {
            const exists = globalMatches.some(gm => {
                const id1 = gm.team1?.id;
                const id2 = gm.team2?.id;
                return (id1 === pair.team1.id && id2 === pair.team2.id) ||
                       (id1 === pair.team2.id && id2 === pair.team1.id);
            });
            if (!exists) missingCount++;
        });
    });

    if (missingCount === 0 && targetTotal > 0) {
        disableGenerateButtons("Round Robin Generated ✓");
    } else {
        enableGenerateButtons("Generate Round Robin");
    }
}

function setGenerateButtonsLoading(text) {
    const matchBtn = document.getElementById("matchesGenerateBtn");
    updateGenerateBtnText(matchBtn, text, true);
}

function disableGenerateButtons(text) {
    const matchBtn = document.getElementById("matchesGenerateBtn");
    updateGenerateBtnText(matchBtn, text, true);
}

function enableGenerateButtons(text) {
    const matchBtn = document.getElementById("matchesGenerateBtn");
    updateGenerateBtnText(matchBtn, text, false);
}

function updateGenerateBtnText(btn, text, disabled) {
    if (!btn) return;
    btn.disabled = disabled;
    const span = btn.querySelector("span");
    if (span) {
        span.textContent = text;
    } else {
        btn.textContent = text;
    }
}

// =====================================================
// RENDER STANDINGS & SORTING
// Rule: Sort by 1. Points DESC, 2. Wins DESC, 3. Name ASC
// Includes Win Rate % calculation: (Won / Played) * 100
// =====================================================
function renderStandings() {
    const dashboardBody = document.getElementById("standingsTable");
    const fullBody = document.getElementById("fullStandingsTable");

    const sortedTeams = [...globalTeams].sort((a, b) => {
        const ptsA = a.points ?? 0;
        const ptsB = b.points ?? 0;
        if (ptsB !== ptsA) return ptsB - ptsA;

        const winsA = a.won ?? 0;
        const winsB = b.won ?? 0;
        if (winsB !== winsA) return winsB - winsA;

        return (a.name || "").localeCompare(b.name || "");
    });

    // Dashboard Points Table Preview
    if (dashboardBody) {
        if (sortedTeams.length === 0) {
            dashboardBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center" style="padding: 24px;">No teams registered</td>
                </tr>
            `;
        } else {
            dashboardBody.innerHTML = sortedTeams.map((team, idx) => {
                const played = team.played ?? 0;
                const won = team.won ?? 0;
                const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
                const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
                const rankLabel = idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`;

                return `
                    <tr>
                        <td class="text-center">
                            <span class="rank-badge ${rankClass}">${rankLabel}</span>
                        </td>
                        <td><strong>${escapeHtml(team.name)}</strong></td>
                        <td class="text-center">${played}</td>
                        <td class="text-center">${won}</td>
                        <td class="text-center">${team.lost ?? 0}</td>
                        <td class="text-center"><strong style="color: var(--primary); font-size: 1.05rem;">${team.points ?? 0}</strong></td>
                        <td class="text-center"><strong style="color: var(--success);">${winRate}%</strong></td>
                    </tr>
                `;
            }).join("");
        }
    }

    // Full Standings Table with Position and Win Rate %
    if (fullBody) {
        if (sortedTeams.length === 0) {
            fullBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="padding: 35px;">No team data available</td>
                </tr>
            `;
        } else {
            fullBody.innerHTML = sortedTeams.map((team, idx) => {
                const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
                const rankLabel = idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`;
                const played = team.played ?? 0;
                const won = team.won ?? 0;
                const winRate = played > 0 ? Math.round((won / played) * 100) : 0;

                return `
                    <tr>
                        <td class="text-center">
                            <span class="rank-badge ${rankClass}">${rankLabel}</span>
                        </td>
                        <td><strong style="font-size: 1rem; color: white;">${escapeHtml(team.name)}</strong></td>
                        <td class="text-center">${played}</td>
                        <td class="text-center">${won}</td>
                        <td class="text-center">${team.lost ?? 0}</td>
                        <td class="text-center"><strong style="color: var(--primary); font-size: 1.15rem;">${team.points ?? 0}</strong></td>
                        <td class="text-center">
                            <span style="font-weight: 700; color: ${winRate >= 50 ? 'var(--success)' : 'var(--text-muted)'};">${winRate}%</span>
                        </td>
                    </tr>
                `;
            }).join("");
        }
    }
}

// =====================================================
// UPDATE DASHBOARD STATS CARDS
// =====================================================
function updateDashboardStats() {
    const tCountEl = document.getElementById("teamCount");
    if (tCountEl) tCountEl.textContent = globalTeams.length;
}

// =====================================================
// TOAST NOTIFICATIONS & UTILITIES
// =====================================================
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "warning") icon = "⚠️";

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Global Backdrop Click Listener for Modals
window.addEventListener("click", event => {
    const teamModal = document.getElementById("teamModal");
    const matchModal = document.getElementById("matchModal");
    const updateModal = document.getElementById("updateScoreModal");

    if (event.target === teamModal) closeTeamForm();
    if (event.target === matchModal) closeMatchForm();
    if (event.target === updateModal) closeUpdateScoreModal();
});

// ESC key listener to close active modals
window.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeTeamForm();
        closeMatchForm();
        closeUpdateScoreModal();
    }
});