const config = require("./config");
const bigquery = new require("@google-cloud/bigquery")(config);

class DataLoader {
  static load(query) {
    return bigquery
      .query({
        query,
        useLegacySql: false
      })
      .then(results => results[0]);
  }

  static loadFifaRank() {
    return DataLoader.load(
      "SELECT Rank as rank, TRIM(Team) as team, Total_Points as points FROM `paul_the_octopus_dataset.fifa_rank`"
    );
  }

  static loadCupMatches() {
    return DataLoader.load(
      "SELECT TRIM(home) as home, TRIM(away) as away FROM `paul_the_octopus_dataset.matches`"
    );
  }

  static loadHistoricalMatchesByTeams(teams) {
    // remove duplicates
    const teamsList = teams.map(team => `'${team}'`).join(",");

    return DataLoader.load(
      `SELECT home, home_score, away, away_score 
        FROM \`paul_the_octopus_dataset.matches_history\` 
        WHERE (home IN (${teamsList}) OR away IN (${teamsList}))`
    );
  }
}

module.exports = DataLoader;
