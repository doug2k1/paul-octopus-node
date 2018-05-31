class Match {
  constructor(home, away) {
    this.home = home;
    this.away = away;
  }

  predict(fifaRank, historicalMatches) {
    // find matches between friends
    const homeFriendsMatchesAsHome = historicalMatches.filter(
      m =>
        this.home.friends.includes(m.home) && this.away.friends.includes(m.away)
    );
    const homeFriendsMatchesAsAway = historicalMatches.filter(
      m =>
        this.home.friends.includes(m.away) && this.away.friends.includes(m.home)
    );
    const awayFriendsMatchesAsHome = historicalMatches.filter(
      m =>
        this.away.friends.includes(m.home) && this.home.friends.includes(m.away)
    );
    const awayFriendsMatchesAsAway = historicalMatches.filter(
      m =>
        this.away.friends.includes(m.away) && this.home.friends.includes(m.home)
    );

    let homeScore;

    // consider at least 2 historical matches between the two groups
    if (homeFriendsMatchesAsHome.length + homeFriendsMatchesAsAway.length > 1) {
      const homeScores = [
        ...homeFriendsMatchesAsHome.map(m => m.home_score),
        ...homeFriendsMatchesAsAway.map(m => m.away_score)
      ];
      homeScore = Math.round(
        homeScores.reduce((prev, current) => (prev += current), 0) /
          homeScores.length
      );
    }

    let awayScore;

    // consider at least 2 historical matches between the two groups
    if (awayFriendsMatchesAsHome.length + awayFriendsMatchesAsAway.length > 1) {
      const awayScores = [
        ...awayFriendsMatchesAsHome.map(m => m.home_score),
        ...awayFriendsMatchesAsAway.map(m => m.away_score)
      ];
      awayScore = Math.round(
        awayScores.reduce((prev, current) => (prev += current), 0) /
          awayScores.length
      );
    }

    if (homeScore === undefined || awayScore === undefined) {
      const homePoints = fifaRank.getTeam(this.home.name).points;
      const awayPoints = fifaRank.getTeam(this.away.name).points;
      homeScore = Math.round(Math.min(homePoints / awayPoints, 4));
      awayScore = Math.round(Math.min(awayPoints / homePoints, 4));
    }

    return [this.home.name, homeScore, awayScore, this.away.name];
  }
}

module.exports = Match;
