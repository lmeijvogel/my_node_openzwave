fs = require("fs")
read = (filename) ->
  contents = fs.readFileSync(filename, "utf8")
  JSON.parse contents

exports.read = read
