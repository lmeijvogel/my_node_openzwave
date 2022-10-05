fs = require("fs")

class ConfigReader
  read: (filename) ->
    contents = fs.readFileSync(filename, "utf8")
    JSON.parse contents

module.exports = ConfigReader
