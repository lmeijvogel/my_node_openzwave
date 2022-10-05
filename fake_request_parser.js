'use strict';

function FakeRequestParser() {
  function parse(request) {
    var eventPattern = '^/([^/]*)/([^/]*)/(.*)$';

    var parser = new RegExp(eventPattern);
    var match = request.url.match(parser);

    if (match) {
      var type  = match[1];
      var node  = match[2];
      var value = match[3];

      return {
        type: type,
        node: parseInt(node, 10),
        value: parseInt(value, 10)
      };
    }

    return null;
  }

  return {
    parse: parse
  };
}

module.exports = FakeRequestParser;
