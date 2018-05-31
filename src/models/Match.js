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
    const awayFriendsMatchesAsHome = historicalMatches.filter(
      m =>
        this.away.friends.includes(m.home) && this.home.friends.includes(m.away)
    );

    let homeScore;
    let awayScore;

    // consider at least 2 historical matches between the two groups
    if (homeFriendsMatchesAsHome.length + awayFriendsMatchesAsHome.length > 1) {
      const homeScores = [
        ...homeFriendsMatchesAsHome.map(m => m.home_score),
        ...awayFriendsMatchesAsHome.map(m => m.away_score)
      ];
      homeScore = Math.round(
        homeScores.reduce((prev, current) => (prev += current), 0) /
          homeScores.length
      );

      const awayScores = [
        ...homeFriendsMatchesAsHome.map(m => m.away_score),
        ...awayFriendsMatchesAsHome.map(m => m.home_score)
      ];
      awayScore = Math.round(
        awayScores.reduce((prev, current) => (prev += current), 0) /
          awayScores.length
      );
    } else {
      // no historical matches, use rank points to predict
      const homePoints = fifaRank.getTeam(this.home.name).points;
      const awayPoints = fifaRank.getTeam(this.away.name).points;
      homeScore = Math.round(Math.min(homePoints / awayPoints, 4));
      awayScore = Math.round(Math.min(awayPoints / homePoints, 4));
    }

    return [this.home.name, homeScore, awayScore, this.away.name];
  }
}

module.exports = Match;
