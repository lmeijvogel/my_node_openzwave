'use strict';

function FakeRequestParser() {
  function parse(request) {
    const eventPattern = '^/([^/]*)/([^/]*)/(.*)$';

    const parser = new RegExp(eventPattern);
    const match = request.url.match(parser);

    if (match) {
      const type  = match[1];
      const node  = match[2];
      const value = match[3];

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
