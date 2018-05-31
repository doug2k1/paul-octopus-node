const config = require("../config");
const storage = new require("@google-cloud/storage")(config);

class DataStore {
  constructor() {
    this.bucket = config.bucket;
  }

  saveFile(fileName, data, contentType = "text/plain") {
    const file = storage.bucket(this.bucket).file(fileName);

    return file
      .save(data, {
        metadata: {
          contentType
        },
        resumable: false
      })
      .then(result => {
        console.log(
          `[DataStore] Saved "${fileName} to bucket "${this.bucket}"`
        );
        return result;
      });
  }
}

module.exports = DataStore;
