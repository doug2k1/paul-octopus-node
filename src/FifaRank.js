class FifaRank {
  data = [];

  constructor(data) {
    this.data = data;
  }

  getTeam(team) {
    return this.data.find(row => row.team === team);
  }

  getCloseTeams(team, distance) {
    const teamRank = this.getTeam(team);

    if (teamRank) {
      const minRank = teamRank.rank - distance;
      const maxRank = teamRank.rank + distance;

      return this.data
        .filter(row => row.rank >= minRank && row.rank <= maxRank)
        .map(teamData => teamData.team);
    } else {
      return [team];
    }
  }
}

module.exports = FifaRank;
