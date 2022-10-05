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

const Ticker = require('./ticker');
const AutomaticRunner = require('./automatic_runner');

const argv = minimist(process.argv.slice(2));

const configFile = argv['config'] || './config.json';
const config = ConfigReader().read(configFile);

const logFile = argv['logfile'] || config['log']['file'] || './log/openzwave.log';

Logger.enableLogToFile(logFile, config['log']['level']);

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

let vacationMode = false;
let vacationMeanStartTime = null;
let vacationMeanEndTime = null;

function stopProgramme() {
  Logger.info('disconnecting...');
  zwave.disconnect();
  redisInterface.cleanUp();

  process.exit();
}

process.on('SIGINT', stopProgramme);
process.on('SIGTERM', stopProgramme);

const redisInterface = RedisInterface('MyZWave');
const redisCommandParser = RedisCommandParser();

redisInterface.start();
Promise.all([
  redisInterface.clearCurrentLightLevels(),
  redisInterface.clearAvailableProgrammes()
]).then(function () {
  const myZWave = MyZWave(zwave);
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

    Logger.debug('Received value change from ', node.nodeId);
    Logger.debug('New value: ', commandClass, ': ', value);

    redisInterface.storeValue(lightName, commandClass, value);
  });

  redisInterface.on('commandReceived', function (command) {
    Logger.debug('Received command via Redis: ', command);

    redisCommandParser.parse(command);
  });

  myZWave.onNodeEvent(function (node, event) {
    Logger.debug('Event from node ', node.nodeId);
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

  redisCommandParser.on('setVacationModeRequested', function (state, meanStartTime, meanEndTime) {
    vacationMode = state;

    if (vacationMode) {
      vacationMeanStartTime = meanStartTime;
      vacationMeanEndTime   = meanEndTime;

      startVacationMode(meanStartTime, meanEndTime);
      Logger.info('Started Vacation mode. Mean start time:', vacationMeanStartTime,
        'mean end time:', vacationMeanEndTime);
    } else {
      vacationMeanStartTime = 'no start time set';
      vacationMeanEndTime   = 'no end time set';

      stopVacationMode();
      Logger.info('Stopped vacation mode');
    }

  });

  eventProcessor.on('programmeSelected', function (programmeName) {
    if (programmeName) {
      redisInterface.programmeChanged(programmeName);
      currentProgramme = programmeName;
    }
  });

  let currentProgramme = null;

  let onTicker = null;
  let offTicker = null;

  function startVacationMode(meanStartTime, meanEndTime) {
    function eveningFunction() {
      eventProcessor.programmeSelected('evening');
    }

    function offFunction() {
      eventProcessor.programmeSelected('off');
    }

    const offsetProvider = () => 15 - Math.round(Math.random() * 30);

    onTicker = new Ticker('startProgramme');
    onTicker.start(AutomaticRunner(eveningFunction, {
      periodStart: meanStartTime,
      periodEnd: meanEndTime,
      timeService: TimeService(config),
      offsetProvider: offsetProvider
    }), 15000);

    offTicker = new Ticker('endProgramme');
    offTicker.start(AutomaticRunner(offFunction, {
      periodStart: meanEndTime,
      periodEnd: '23:59',
      timeService: TimeService(config),
      offsetProvider: offsetProvider
    }), 15000);

    redisInterface.vacationModeStarted(meanStartTime, meanEndTime);
  }

  function stopVacationMode() {
    redisInterface.vacationModeStopped();

    if (onTicker) {
      onTicker.stop();
    }

    if (offTicker) {
      offTicker.stop();
    }
  }

  myZWave.connect();
});
