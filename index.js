const options = {
  projectId: "project-paul-the-octopus"
};
const bigquery = new require("@google-cloud/bigquery")(options);
const storage = new require("@google-cloud/storage")(options);
const _ = require("lodash");
const bucket = "ciandt_projectoctopus_2018_dmatoso";
let fifaRank = [];
let cupTeams = [];
let cupMatches = [];
let cupMatchesWithFriends = [];
let historicalMatches = [];

const RANK_DIFF = 2;

// get close teams in rank
function getCloseTeams(team) {
  const teamRank = fifaRank.find(row => row.team === team);

  if (teamRank) {
    const minRank = teamRank.rank - RANK_DIFF;
    const maxRank = teamRank.rank + RANK_DIFF;
    return fifaRank
      .filter(row => row.rank >= minRank && row.rank <= maxRank)
      .map(teamData => teamData.team);
  } else {
    return [team];
  }
}

function buildScore(matchData) {
  // find matches between team is both friend groups
  const homeFriendsMatchesAsHome = historicalMatches.filter(
    m =>
      matchData.homeFriends.includes(m.home) &&
      matchData.awayFriends.includes(m.away)
  );
  const homeFriendsMatchesAsAway = historicalMatches.filter(
    m =>
      matchData.homeFriends.includes(m.away) &&
      matchData.awayFriends.includes(m.home)
  );
  const awayFriendsMatchesAsHome = historicalMatches.filter(
    m =>
      matchData.awayFriends.includes(m.home) &&
      matchData.homeFriends.includes(m.away)
  );
  const awayFriendsMatchesAsAway = historicalMatches.filter(
    m =>
      matchData.awayFriends.includes(m.away) &&
      matchData.homeFriends.includes(m.home)
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
  } else {
    const homePoints = fifaRank.find(
      teamData => teamData.team === matchData.match.home
    ).points;
    const awayPoints = fifaRank.find(
      teamData => teamData.team === matchData.match.away
    ).points;
    homeScore = Math.round(Math.min(homePoints / awayPoints, 4));
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
  } else {
    const homePoints = fifaRank.find(
      teamData => teamData.team === matchData.match.home
    ).points;
    const awayPoints = fifaRank.find(
      teamData => teamData.team === matchData.match.away
    ).points;
    awayScore = Math.round(Math.min(awayPoints / homePoints, 4));
  }

  return [matchData.match.home, homeScore, awayScore, matchData.match.away];
}

function predict() {
  // get 2018 teams
  bigquery
    .query({
      query: "SELECT TRIM(Team) as team FROM `paul_the_octopus_dataset.teams`",
      useLegacySql: false
    })
    .then(results => {
      cupTeams = results[0].map(teamData => teamData.team);

      // load Fifa rank
      return bigquery.query({
        query:
          "SELECT Rank as rank, TRIM(Team) as team, Total_Points as points FROM `paul_the_octopus_dataset.fifa_rank`",
        useLegacySql: false
      });
    })
    .then(results => {
      fifaRank = results[0];

      // load 2018 matches
      return bigquery.query({
        query:
          "SELECT TRIM(home) as home, TRIM(away) as away FROM `paul_the_octopus_dataset.matches`",
        useLegacySql: false
      });
    })
    .then(results => {
      cupMatches = results[0];

      // find home and away close teams in rank
      return cupMatches.map(match => {
        return {
          match,
          homeFriends: getCloseTeams(match.home),
          awayFriends: getCloseTeams(match.away)
        };
      });
    })
    .then(matches => {
      cupMatchesWithFriends = matches;

      // find historical matches between cup teams
      const teamsSet = new Set(
        _.flatten(
          matches.map(match => [...match.homeFriends, ...match.awayFriends])
        )
      );
      const teamsList = Array.from(teamsSet)
        .map(team => `'${team}'`)
        .join(",");

      return bigquery.query({
        query: `SELECT home, home_score, away, away_score 
        FROM \`paul_the_octopus_dataset.matches_history\` 
        WHERE (home IN (${teamsList}) OR away IN (${teamsList}))`,
        useLegacySql: false
      });
    })
    .then(results => {
      historicalMatches = results[0];

      return cupMatchesWithFriends.map(m => buildScore(m));
    })
    .then(results => {
      // build csv
      const csv =
        "home,home_score,away_score,away\n" +
        results.map(row => row.join(",")).join("\n");

      const file = storage.bucket(bucket).file("predictions.csv");
      return file.save(csv, {
        metadata: {
          contentType: "text/plain"
        },
        resumable: false
      });
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
}

// To run locally, uncomment the line below and comment the exports block.
predict();

// Update the exported function name to your login below:
// exports.dmatoso = (req, res) => {
//   predict()
//     .then(() => {
//       res.status(200).send("ok\n");
//     })
//     .catch(err => {
//       res.status(500).send(err);
//     });
// };
