'use strict';

const restServer = require('./rest_server');
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
const EventLogger = require('./event_logger');

const VacationMode = require('./vacation_mode');

const argv = minimist(process.argv.slice(2));

const configFile = argv['config'] || './config.json';
const config = ConfigReader().read(configFile);

const logFile = argv['logfile'] || config['log']['file'] || './log/openzwave.log';

Logger.enableLogToFile(logFile, config['log']['level']);

Logger.info('Starting server');

const testMode = !argv['live'];

const ZWaveFactory = require('./zwave_factory');
const zwave = ZWaveFactory(testMode).create();

let api;

function stopProgramme() {
  Logger.info('disconnecting...');
  eventLogger.store({
    initiator: null,
    event: 'Daemon stopped',
    data: null
  });
  api.stop();
  zwave.disconnect();
  redisInterface.cleanUp();
  eventLogger.stop();

  process.exit();
}

process.on('SIGINT', stopProgramme);
process.on('SIGTERM', stopProgramme);

const eventLogger = EventLogger();

const redisInterface = RedisInterface('MyZWave');

const redisCommandParser = RedisCommandParser();

redisInterface.start();
// TODO: Remove Promise.resolve()
Promise.resolve().then(function () {
  let currentProgramme = null;
  let switchEnabled = true;

  eventLogger.start();

  eventLogger.store({
    initiator: null,
    event: 'Daemon started',
    data: null
  });

  const myZWave = MyZWave(zwave);
  const programmeFactory = ProgrammeFactory();

  const programmes = programmeFactory.build(config.programmes, config.lights);

  const stateMachines = StateMachineBuilder(config.transitions, programmes).call();

  const nextProgrammeChooser = NextProgrammeChooser(TimeService(config.periodStarts), stateMachines);

  const eventProcessor = EventProcessor(myZWave, programmes, nextProgrammeChooser);

  const vacationMode = new VacationMode({
    timeService: TimeService(config.periodStarts),
    onFunction: function () { eventProcessor.programmeSelected('evening'); },
    offFunction: function () { eventProcessor.programmeSelected('off'); }
  });

  api = restServer({vacationMode: vacationMode, myZWave: myZWave});

  api.start();

  vacationMode.onStart(function (meanStartTime, meanEndTime) {
    redisInterface.vacationModeStarted(meanStartTime, meanEndTime);
  });

  vacationMode.onStop(function () {
    redisInterface.vacationModeStopped();
  });

  myZWave.onValueChange(function (node, commandClass, value) {
    const lightName = _.findKey(config.lights, function (light) {
      return light.id === node.nodeId;
    });

    if (!config.lights[lightName].values) {
      config.lights[lightName].values = {};
    }
    config.lights[lightName].values[commandClass] = value;

    Logger.debug('Received value change from ', node.nodeId);
    Logger.debug('New value: ', commandClass, ': ', value);
  });

  redisInterface.on('commandReceived', function (command) {
    Logger.debug('Received command via Redis: ', command);

    redisCommandParser.parse(command);
  });

  myZWave.onNodeEvent(function (node, event) {
    Logger.debug('Event from node ', node.nodeId);
    if (node.nodeId === 3) {
      switchPressed(event);
    } else {
      Logger.warn('Event from unexpected node ', node);
      Logger.verbose('.. event: ', event);
    }

  });

  api.setProgrammesListFinder(function () {
    return programmes;
  });

  api.setLightsListFinder(function () {
    return config.lights;
  });

  api.setCurrentProgrammeFinder(function () {
    return currentProgramme;
  });

  api.onProgrammeChosen(function (programmeName) {
    eventProcessor.programmeSelected(programmeName);
  });

  api.setMainSwitchStateFinder(function () {
    return switchEnabled;
  });

  api.onSwitchStateChangeRequested(function (enabled) {
    if (enabled) {
      Logger.info('Enabling switch');
    } else {
      Logger.info('Disabling switch');
    }

    switchEnabled = enabled;
  });

  redisCommandParser.on('healNetworkRequested', function () {
    Logger.info('Requested healing the network');
    zwave.healNetwork();
  });

  eventProcessor.on('programmeSelected', function (programmeName) {
    if (programmeName) {
      currentProgramme = programmeName;

      eventLogger.store({
        initiator: 'event processor',
        event: 'programme selected',
        data: programmeName
      });
    }
  });

  redisCommandParser.on('simulateSwitchPress', function (event) {
    switchPressed(event);
  });

  redisCommandParser.on('refreshNodeRequested', function (nodeid) {
    zwave.refreshNodeInfo(nodeid);
  });


  redisInterface.getVacationMode().then(function (data) {
    if (data.state === 'on') {
      Logger.info('Vacation mode was still on. Enabling.');

      vacationMode.start(data.start_time, data.end_time);
    }
  });

  myZWave.connect();

  function switchPressed(event) {
    if (switchEnabled) {
      eventProcessor.mainSwitchPressed(event, currentProgramme);
      eventLogger.store({
        initiator: 'wall switch',
        event: 'switch pressed',
        data: event === 255 ? 'on' : 'off'
      });
    } else {
      Logger.warn('Switch pressed but temporarily disabled.');
    }
  }
}).catch(function (error) {
  console.error(error);

  process.exit(1);
});
