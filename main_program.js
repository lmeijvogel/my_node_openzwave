'use strict';

const http = require('http');
const minimist = require('minimist');
const _ = require('lodash');

const MyZWave = require('./my_zwave');
const ProgrammeFactory = require('./programme_factory');
const StateMachineBuilder = require('./state_machine_builder');

const TimeService = require('./time_service');
const NextProgrammeChooser = require('./next_programme_chooser');

const EventProcessor = require('./event_processor');
const RedisCommandParser = require('./redis_command_parser');
const RedisInterface = require('./redis_interface');
const ConfigReader = require('./config_reader');
const Logger = require('./logger');

const argv = minimist(process.argv.slice(2));

const logFile = argv['logfile'] || './log/openzwave.log';

const configFile = argv['config'] || './config.json';
const config = ConfigReader().read(configFile);

Logger.enableLogToFile(logFile);

Logger.info('Starting server');

const runLive = argv['live'];

const runHttpServer = config['http']['enabled'];
const port = config['http']['port'];
const testMode = !runLive;

const ZWaveFactory = require('./zwave_factory');
const zwave = ZWaveFactory(testMode).create();

if (runHttpServer) {
  http.createServer(function (req, res) {
    let result = '';

    if (testMode) {
      result = zwave.tryParse(req, res);
    }
    res.writeHead(200, {'Content-Type': 'text/html'});

    return res.end(req.url + '<br/><pre>' + result + '</pre>');
  }).listen(port);
  Logger.info('Listening on 0.0.0.0, port', port);
} else {
  Logger.info('Not starting HTTP server. Disabled in config.');
}

function stopProgramme() {
  Logger.info('disconnecting...');
  zwave.disconnect();
  redisInterface.cleanUp();
  process.exit();
}

process.on('SIGINT', stopProgramme);
process.on('SIGTERM', stopProgramme);

const myZWave = MyZWave(zwave);
const redisInterface = RedisInterface('MyZWave');
const redisCommandParser = RedisCommandParser();

redisInterface.start();

redisInterface.clearAvailableProgrammes();
const programmeFactory = ProgrammeFactory();

programmeFactory.onProgrammeCreated(function (programme) {
  redisInterface.addAvailableProgramme(programme.name, programme.displayName);
});

const programmes = programmeFactory.build(config);

const stateMachines = StateMachineBuilder(config).call();

const nextProgrammeChooser = NextProgrammeChooser(TimeService(config), stateMachines);

const eventProcessor = EventProcessor(myZWave, programmes, nextProgrammeChooser);

myZWave.onValueChange(function (node, commandClass, value) {
  const lightName = _.invert(config['lights'])['' + node.nodeId];

  redisInterface.storeValue(lightName, commandClass, value);
});

redisInterface.on('commandReceived', function (command) {
  redisCommandParser.parse(command);
});

myZWave.onNodeEvent(function (node, event) {
  if (node.nodeId === 3) {
    eventProcessor.mainSwitchPressed(event);
  } else {
    Logger.warn('Event from unexpected node ', node);
    Logger.verbose('.. event: ', event);
  }

});

redisCommandParser.on('nodeValueRequested', function (nodeId, commandClass, index) {
  myZWave.logValue(nodeId, commandClass, index);
});

redisCommandParser.on('programmeChosen', function (programmeName) {
  eventProcessor.programmeSelected(programmeName);
});

redisCommandParser.on('neighborsRequested', function (nodeId) {
  zwave.getNeighbors(nodeId);
});

redisCommandParser.on('healNetworkRequested', function () {
  Logger.info('Requested healing the network');
  zwave.healNetwork();
});

eventProcessor.on('programmeSelected', function (programmeName) {
  if (programmeName) {
    redisInterface.programmeChanged(programmeName);
  }
});

myZWave.connect();
