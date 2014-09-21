class FakeRequestParser
  parse: (request) ->
    eventPattern = "^/([^/]*)/([^/]*)/(.*)$"

    parser = new RegExp(eventPattern)

    match = request.url.match(parser)
    if match
      [_, type, node, value] = match

      return (
        type: type
        node: parseInt(node, 10)
        value: parseInt(value, 10)
      )
    null

module.exports = FakeRequestParser
