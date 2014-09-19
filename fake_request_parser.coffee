classy = require("classy")
FakeRequestParser = classy.define(parse: (request) ->
  eventPattern = "^/([^/]*)/([^/]*)/(.*)$"
  parser = new RegExp(eventPattern)
  match = request.url.match(parser)
  if match
    type = match[1]
    node = parseInt(match[2], 10)
    value = parseInt(match[3], 10)
    return (
      type: type
      node: node
      value: value
    )
  null
)
module.exports = FakeRequestParser
