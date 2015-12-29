var http = require("http");
var minimist = require("minimist");
var _ = require("lodash");

var MyZWave = require("./my_zwave");
var ProgrammeFactory = require("./programme_factory");
var StateMachineBuilder = require("./state_machine_builder");

var TimeService = require("./time_service");
var NextProgrammeChooser = require("./next_programme_chooser");

var EventProcessor = require("./event_processor");
var CommandParser = require("./command_parser");
var RedisInterface = require("./redis_interface");
var ConfigReader = require("./config_reader");
var Logger = require('./logger');

var argv = minimist(process.argv.slice(2));

var logFile = argv["logfile"] || "./log/openzwave.log";

var configFile = argv['config'] ||"./config.json";
var config = ConfigReader().read(configFile);

Logger.enableLogToFile(logFile);

Logger.info("Starting server");

var runLive = argv['live'];

var runHttpServer = config["http"]["enabled"];
var port = config["http"]["port"];
var testMode = !runLive;

var ZWaveFactory = require("./zwave_factory");
var zwave = ZWaveFactory(testMode).create();

if (runHttpServer) {
  http.createServer( function (req, res) {
    var result = "";

    if (testMode) {
      result = zwave.tryParse(req, res);
    }
    res.writeHead(200, { "Content-Type": "text/html" });

    return res.end(req.url + "<br/><pre>" + result + "</pre>");
  }).listen(port);
  Logger.info("Listening on 0.0.0.0, port", port);
} else {
  Logger.info("Not starting HTTP server. Disabled in config.");
}

function stopProgramme() {
  Logger.info("disconnecting...");
  zwave.disconnect();
  redisInterface.cleanUp();
  process.exit();
}

process.on("SIGINT", stopProgramme);
process.on("SIGTERM", stopProgramme);

var myZWave = MyZWave(zwave);
var redisInterface = RedisInterface("MyZWave");
var commandParser = CommandParser();

redisInterface.start();

redisInterface.clearAvailableProgrammes();
var programmeFactory = ProgrammeFactory();

programmeFactory.onProgrammeCreated( function (programme) {
  redisInterface.addAvailableProgramme(programme.name, programme.displayName);
});

var programmes = programmeFactory.build(config);

var stateMachineBuilder = StateMachineBuilder(config);
var stateMachines = stateMachineBuilder.call();

var timeService = TimeService(config);
var nextProgrammeChooser = NextProgrammeChooser(timeService, stateMachines);

var eventProcessor = EventProcessor(myZWave, programmes, nextProgrammeChooser);

myZWave.onValueChange(function (node, commandClass, value) {
  var lightName = _.invert(config["lights"])[""+node.nodeId];
  redisInterface.storeValue(lightName, commandClass, value);
});

redisInterface.on("commandReceived", function (command) {
  commandParser.parse(command);
});

commandParser.on("nodeValueRequested", function (nodeId, commandClass, index) {
  myZWave.logValue(nodeId, commandClass, index);
});

commandParser.on("programmeChosen", function (programmeName) {
  eventProcessor.programmeSelected(programmeName);
});

commandParser.on("neighborsRequested", function (nodeId) {
  zwave.getNeighbors(nodeId);
});

commandParser.on("healNetworkRequested", function () {
  Logger.info("Requested healing the network");
  zwave.healNetwork();
});

eventProcessor.on("programmeSelected", function (programmeName) {
  if (programmeName) {
    redisInterface.programmeChanged(programmeName);
  }
});

myZWave.connect();
