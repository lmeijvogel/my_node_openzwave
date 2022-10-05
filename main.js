var http = require('http');
var fs = require('fs');
var _  = require('lodash');

var MyZWave = require('./my_zwave');
var ProgrammeFactory = require('./programme_factory');
var EventProcessor = require('./event_processor');

var CommandParser = require('./command_parser');
var RedisInterface = require('./redis_interface');
var ConfigReader = require('./config_reader');
var config = ConfigReader.read("config.json");

var runHttpServer = config["http"]["enabled"];
var port = config["http"]["port"];

var testMode = process.argv[2] != 'live';

var ZWaveFactory = require('./zwave_factory');
var zwave = new ZWaveFactory(testMode).create();

if (runHttpServer) {
  http.createServer(function (req, res) {
    var result = "";
    if (testMode) {
      result = zwave.tryParse(req, res);
    }
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(req.url+"<br/><pre>"+result+"</pre>");
  }).listen(port);

  console.log("Listening on 0.0.0.0:%d", port);
} else {
  console.log("Not starting HTTP server. Disabled in config.");
}

process.on('SIGINT', function() {
    console.log('disconnecting...');
    zwave.disconnect();
    redisInterface.cleanUp();
    process.exit();
});

var myZWave = new MyZWave(zwave);

var redisInterface = new RedisInterface("MyZWave");
var commandParser = new CommandParser();

var programmeFactory = new ProgrammeFactory();
var programmes = programmeFactory.build(config);
var eventProcessor = new EventProcessor(myZWave, programmes);

redisInterface.onCommandReceived(function(command) {
  commandParser.parse(command);
});

commandParser.onProgrammeSelected(function(programmeName) {
  eventProcessor.programmeSelected(programmeName);
});

myZWave.onValueChange(function(node, commandClass, value) {
  console.log(config);
  var lightName = _.invert(config["lights"])[""+node.nodeId];
  redisInterface.storeValue(lightName, commandClass, value);
});

var eventProcessor = new EventProcessor(myZWave, programmes);

redisInterface.start();
myZWave.connect();
