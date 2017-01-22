'use strict';

const minimist = require('minimist');
const _ = require('lodash');

const MyZWave = require('./my_zwave');
const ProgrammeFactory = require('./programme_factory');
const StateMachineBuilder = require('./state_machine_builder');

const TimeService = require('./time_service');
const NextProgrammeChooser = require('./next_programme_chooser');

const EventProcessor = require('./event_processor');

const RedisCommandParser = require('./redis_command_parser');
const MainSwitchState = require('./main_switch_state');
const LightsStore = require('./lights_store');
const ProgrammesStore = require('./programmes_store');

const ConfigReader = require('./config_reader');
const Logger = require('./logger');
const EventLogger = require('./event_logger');

const VacationMode = require('./vacation_mode');
const VacationModeStore = require('./vacation_mode_store');

const Redis = require('redis');

const argv = minimist(process.argv.slice(2));

const configFile = argv['config'] || './config.json';
const config = ConfigReader().read(configFile);

const logFile = argv['logfile'] || config['log']['file'] || './log/openzwave.log';

Logger.enableLogToFile(logFile, config['log']['level']);

Logger.info('Starting server');

const testMode = !argv['live'];

const ZWaveFactory = require('./zwave_factory');
const zwave = ZWaveFactory(testMode).create();

const listenerRedis = Redis.createClient();
const redis = Redis.createClient();

function stopProgramme() {
  Logger.info('disconnecting...');
  eventLogger.store({
    initiator: null,
    event: 'Daemon stopped',
    data: null
  });
  zwave.disconnect();

  listenerRedis.end();
  redis.end();

  eventLogger.stop();

  process.exit();
}

process.on('SIGINT', stopProgramme);
process.on('SIGTERM', stopProgramme);

const eventLogger = EventLogger();

const redisCommandParser = RedisCommandParser();

const mainSwitchState = MainSwitchState(redis);
const lightsStore = LightsStore(redis);
const programmesStore = ProgrammesStore(redis);
const vacationModeStore = VacationModeStore(redis);

const RedisCommandListener = require('./redis_command_listener');
const redisCommandListener = RedisCommandListener(listenerRedis, 'MyZWave', redisCommandParser);

redisCommandListener.start();


Promise.all([
  lightsStore.clearNodes(),
  programmesStore.clearProgrammes()
]).then(function () {
  let switchEnabled = true;

  mainSwitchState.switchEnabled();

  eventLogger.start();

  eventLogger.store({
    initiator: null,
    event: 'Daemon started',
    data: null
  });

  const myZWave = MyZWave(zwave);
  const programmeFactory = ProgrammeFactory();

  _(config.lights).each(function (light, key) {
    const lightName = key;

    lightsStore.storeNode(lightName, light.id, light.displayName);
  });

  const programmes = programmeFactory.build(config.programmes, config.lights);

  _(programmes).values().each(function (programme) {
    programmesStore.addProgramme(programme.name, programme.displayName);
  });

  const stateMachines = StateMachineBuilder(config.transitions, programmes).call();

  const nextProgrammeChooser = NextProgrammeChooser(TimeService(config.periodStarts), stateMachines);

  const eventProcessor = EventProcessor(myZWave, programmes, nextProgrammeChooser);

  const vacationMode = new VacationMode({
    store: vacationModeStore,
    timeService: TimeService(config.periodStarts),
    onFunction: function () { eventProcessor.programmeSelected('evening'); },
    offFunction: function () { eventProcessor.programmeSelected('off'); }
  });

  myZWave.onValueChange(function (node, commandClass, value) {
    const lightName = _.findKey(config.lights, function (light) {
      return light.id === node.nodeId;
    });

    Logger.debug('Received value change from ', node.nodeId);
    Logger.debug('New value: ', commandClass, ': ', value);

    lightsStore.storeValue(lightName, node.nodeId, commandClass, value);
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

  redisCommandParser.on('nodeValueRequested', function (nodeId, commandClass, index) {
    myZWave.logValue(nodeId, commandClass, index);
  });

  redisCommandParser.on('setNodeValue', function (nodeId, value) {
    switch (value) {
    case 'on':
      myZWave.switchOn(nodeId);
      break;
    case 'off':
      myZWave.switchOff(nodeId);
      break;
    default:
      myZWave.setLevel(nodeId, value);
      break;
    }
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
    if (state) {
      vacationMode.start(meanStartTime, meanEndTime);
      Logger.info('Started Vacation mode. Mean start time:', meanStartTime,
        'mean end time:', meanEndTime);
    } else {
      vacationMode.stop();
      Logger.info('Stopped vacation mode');
    }

  });

  redisCommandParser.on('temporarilyDisableSwitch', function () {
    Logger.info('Temporarily disabling switch');
    mainSwitchState.switchDisabled();
    switchEnabled = false;

    // Automatically enabling the switch does not work correctly:
    // For some reason, after the function is executed, no events
    // are processed anymore.
    //setTimeout(function () {
      //Logger.info('Automatically enabling switch');
      //mainSwitchState.switchEnabled();
      //switchEnabled = true;
    //}, 120000);
  });

  redisCommandParser.on('enableSwitch', function () {
    Logger.info('Manually enabling switch');
    mainSwitchState.switchEnabled();
    switchEnabled = true;
  });

  eventProcessor.on('programmeSelected', function (programmeName) {
    if (programmeName) {
      programmesStore.programmeChanged(programmeName);

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

  myZWave.connect();

  function switchPressed(event) {
    if (switchEnabled) {
      eventProcessor.mainSwitchPressed(event, programmesStore.currentProgramme());
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
