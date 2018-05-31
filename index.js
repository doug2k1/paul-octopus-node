const config = require("./src/config");
const DataLoader = require("./src/data/DataLoader");
const DataStore = require("./src/data/DataStore");
const FifaRank = require("./src/models/FifaRank");
const Team = require("./src/models/Team");
const Match = require("./src/models/Match");

function predict() {
  let fifaRank;
  let cupMatchesWithFriends;

  // load Fifa rank
  return DataLoader.loadFifaRank()
    .then(fifaRankData => {
      fifaRank = new FifaRank(fifaRankData);

      // load Cup matches
      return DataLoader.loadCupMatches();
    })
    .then(cupMatchesData => {
      const cupMatches = cupMatchesData;

      // compute hoe and away friends for each match
      cupMatchesWithFriends = cupMatches.map(match => {
        const home = new Team(match.home);
        home.friends = fifaRank.getCloseTeams(
          home.name,
          config.algorithm.rankDiff
        );
        const away = new Team(match.away);
        away.friends = fifaRank.getCloseTeams(
          away.name,
          config.algorithm.rankDiff
        );

        return new Match(home, away);
      });

      // put all teams and friends in a set
      const teamsAndFriendsSet = new Set(
        cupMatchesWithFriends.reduce((accumulator, match) => {
          return [...accumulator, ...match.home.friends, ...match.away.friends];
        }, [])
      );

      // load historical matches involving all teams
      return DataLoader.loadHistoricalMatchesByTeams(
        Array.from(teamsAndFriendsSet)
      );
    })
    .then(historicalMatches => {
      // compute scores
      const scores = cupMatchesWithFriends.map(m =>
        m.predict(fifaRank, historicalMatches)
      );

      // build csv
      const csv =
        "home,home_score,away_score,away\n" +
        scores.map(row => row.join(",")).join("\n");

      // save to bucket
      const dataStore = new DataStore();

      return dataStore.saveFile("predictions.csv", csv);
    });
}

// To run locally, uncomment the line below and comment the exports block.
// predict();

// Update the exported function name to your login below:
module.exports[config.login] = (req, res) => {
  predict()
    .then(() => {
      res.status(200).send("ok\n");
    })
    .catch(err => {
      res.status(500).send(err);
    });
};
