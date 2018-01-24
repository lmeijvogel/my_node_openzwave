import { RestServer } from './rest_server';
import * as minimist from 'minimist';
import { findKey, forOwn } from 'lodash';

import { MyZWave } from './my_zwave';
import { Light } from './light';
import { IProgramme } from './programme';
import { ProgrammeFactory } from './programme_factory';
import { TimeStateMachine } from './time_state_machine';
import { StateMachineBuilder } from './state_machine_builder';

import { TimeService, TimePeriod } from './time_service';

import { NextProgrammeChooser } from './next_programme_chooser';

import { EventProcessor } from './event_processor';
import { RedisInterface } from './redis_interface';
import { ConfigReader } from './config_reader';
import { Logger } from './logger';
import { EventLogger } from './event_logger';

import { VacationMode } from './vacation_mode';

const argv = minimist(process.argv.slice(2));

const configFile = argv['config'] || './config.json';
const config = new ConfigReader().read(configFile);

const logFile = argv['logfile'] || config['log']['file'] || './log/openzwave.log';

Logger.enableLogToFile(logFile, config['log']['level']);

Logger.info('Starting server');

const testMode = !argv['live'];

import { ZWaveFactory } from './zwave_factory';
const zwave = new ZWaveFactory(testMode).create();

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

const eventLogger = new EventLogger();

const redisInterface = new RedisInterface();

redisInterface.start();

(function () {
  let currentProgramme = null;
  let switchEnabled = true;

  eventLogger.start();

  eventLogger.store({
    initiator: null,
    event: 'Daemon started',
    data: null
  });

  const myZWave = initMyZWave(zwave, config.lights);

  const programmeFactory = new ProgrammeFactory();

  const lights = new Map<string, Light>();

  forOwn(config.lights, (light, name) => {
    lights.set(name, new Light(light.id, light.displayName));
  });

  Logger.debug("main: configuration:", JSON.stringify(config));
  const programmes : IProgramme[] = programmeFactory.build(objectToMap(config.programmes), lights);

  const stateMachines : Map<TimePeriod, TimeStateMachine> = new StateMachineBuilder(config.transitions, programmes).call();

  const nextProgrammeChooser = new NextProgrammeChooser(new TimeService(config.periodStarts), stateMachines);

  const eventProcessor = new EventProcessor(myZWave, programmes, nextProgrammeChooser);

  const vacationMode = initVacationMode(TimeService, eventProcessor, redisInterface);

  api = RestServer({vacationMode: vacationMode, myZWave: myZWave});

  api.setProgrammesListFinder(function () {
    return programmes;
  });

  api.setLightsListFinder(() => config.lights);

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

  api.onHealNetworkRequested(function () {
    Logger.info('Requested healing the network');
    zwave.healNetwork();
  });

  api.onRefreshNodeRequested(function (nodeId) {
    zwave.refreshNodeInfo(nodeId);
  });

  api.onSimulateSwitchPressRequested(function (signal) {
    switchPressed(signal);
  });

  api.start();

  eventProcessor.on('programmeSelected', function (programmeName) {
    if (programmeName) {
      Logger.debug('Storing new currentProgramme', programmeName);
      currentProgramme = programmeName;

      eventLogger.store({
        initiator: 'event processor',
        event: 'programme selected',
        data: programmeName
      });
    } else {
      Logger.error('Invalid programmeName (null/undefined) received from eventProcessor');
    }
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

  function initMyZWave(zwave, lights) {
    const myZWave = new MyZWave(zwave);

    myZWave.onValueChange(function (node, commandClass, value) {
      if (node.nodeId === 3) {
        Logger.info('Received value from main switch: %d, %d -- Ignoring', commandClass, value.value);
        Logger.error('ERROR: Main switch is now probably ignored by OpenZWave. Exiting process so it can be restarted.');

        throw 'Main switch erroneously ignored. Exiting!'
      }

      const lightName = findKey(lights, function (light) {
        return light.id === node.nodeId;
      });

      if (!lightName) {
        Logger.error('Unknown light with nodeId %d. Command class: %d, value: "',
          node.nodeId,
          commandClass,
          value,
          '"');

        return;
      } else if (!lights[lightName]) {
        Logger.error('Unknown light with name "%s" (id: %d). Command class: %d, value: "',
          lightName,
          node.nodeId,
          commandClass,
          value,
          '"');

        return;
      }

      if (!lights[lightName].values) {
        lights[lightName].values = {};
      }
      lights[lightName].values[commandClass] = value;

      Logger.debug('Received value change from ', node.nodeId);
      Logger.debug('New value: ', commandClass, ': ', value);
    });

    myZWave.onNodeEvent(function (node, event) {
      Logger.debug('Event from node %d', node.nodeId);
      if (node.nodeId === 3) {
        switchPressed(event);
      } else {
        Logger.warn('Event from unexpected node %d, event: %d', node.nodeId, event);
      }

    });

    return myZWave;
  }

  function initVacationMode(TimeService, eventProcessor, redisInterface) {
    const vacationMode = new VacationMode(
      new TimeService(config.periodStarts),
      () => { eventProcessor.programmeSelected('evening'); },
      () => { eventProcessor.programmeSelected('off'); }
    );

    vacationMode.onStart(function (meanStartTime, meanEndTime) {
      redisInterface.vacationModeStarted(meanStartTime, meanEndTime);
    });

    vacationMode.onStop(function () {
      redisInterface.vacationModeStopped();
    });

    return vacationMode;
  }
})();

function objectToMap(input : object) : Map<string, object> {
  const result = new Map<string, object>();

  forOwn(input, (value, key) => {
    result.set(key, value);
  });

  return result;
}
