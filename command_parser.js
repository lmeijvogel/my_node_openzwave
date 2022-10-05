var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;

function CommandParser() {
  var nodeValueRegex    = /get (\w+) (\w+) (\w+)/;
  var programmeRegex    = /programme (.*)/;
  var getNeighborsRegex = /neighbors (.*)/;
  var healNetworkRegex  = /healNetwork/;

  var eventEmitter = new EventEmitter();

  var handlers = [
    [nodeValueRegex,    nodeValueRequested],
    [programmeRegex,    programmeChosen],
    [getNeighborsRegex, neighborsRequested],
    [healNetworkRegex,  healNetworkRequested]
  ];

  function parse(command) {
    _.each(handlers, function (handler) {
      var key   = handler[0];
      var value = handler[1];

      var match = command.match(key);

      if (match) {
        value.call(this, match);
        return;
      }
    });
  }

  function nodeValueRequested(match) {
    var nodeId       = match[1];
    var commandClass = match[2];
    var index        = match[3];

    eventEmitter.emit("nodeValueRequested", nodeId, commandClass, index);
  }

  function programmeChosen(match) {
    var programmeName = match[1];
    eventEmitter.emit("programmeChosen", programmeName);
  }

  function neighborsRequested(match) {
    var nodeId = parseInt(match[1], 10);
    eventEmitter.emit("neighborsRequested", nodeId);
  }

  function healNetworkRequested() {
    eventEmitter.emit("healNetworkRequested");
  }

  function on(eventName, handler) {
    eventEmitter.on(eventName, handler);
  }

  return {
    parse: parse,
    on: on
  };
}

module.exports = CommandParser;
