fs = require("fs");

module.exports = {
  snapshot: function (data) {
    const j = JSON.stringify(data);
    //console.log(data);

    fs.writeFile("/tmp/snapshot-ping.json", j, "utf8", (err) => {
      if (err) {
        console.log(`Error writing file: ${err}`);
      } else {
        console.log(`File is written successfully!`);
      }
    });
  },
};
