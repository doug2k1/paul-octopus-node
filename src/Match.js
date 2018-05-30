const Team = require("./Team");

class Match {
  constructor(home, away) {
    this.home = new Team(home);
    this.away = new Team(away);
  }
}

module.exports = Match;
