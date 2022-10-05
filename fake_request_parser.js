var classy = require("classy");

var FakeRequestParser = classy.define({
  parse: function(request) {
    var eventPattern = "^\/([^\/]*)\/([^\/]*)\/(.*)$";

    var parser = new RegExp(eventPattern);

    var match = request.url.match(parser);

    if (match) {
      var type  = match[1];
      var node  = parseInt(match[2] ,10);
      var value = parseInt(match[3] ,10);

      return { type: type, node: node, value: value };
    }

    return null;
  }
});
module.exports = FakeRequestParser;
