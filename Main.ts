import { RestServer } from "./RestServer";
import * as minimist from "minimist";
import { findKey, forOwn } from "lodash";
import { IZWave } from "./IZWave";

import { MyZWave } from "./MyZWave";
import { Light } from "./Light";
import { IProgramme } from "./Programme";
import { ProgrammeFactory } from "./ProgrammeFactory";
import { TimeStateMachine } from "./TimeStateMachine";
import { StateMachineBuilder } from "./StateMachineBuilder";

import { TimeService, TimePeriod } from "./TimeService";

import { NextProgrammeChooser } from "./NextProgrammeChooser";

import { EventProcessor } from "./EventProcessor";
import { RedisInterface } from "./RedisInterface";
import { ConfigReader } from "./ConfigReader";
import { Logger } from "./Logger";
import { EventLogger } from "./EventLogger";

import { VacationMode } from "./VacationMode";

const argv = minimist(process.argv.slice(2));

// NOTE: The light values are stored in `config.lights`, which is confusing.
// Maybe change that?
const configFile = argv["config"] || "./config.json";
const config = new ConfigReader().read(configFile);

const logFile = argv["logfile"] || config["log"]["file"] || "./log/openzwave.log";

Logger.enableLogToFile(logFile, config["log"]["level"]);

Logger.info("Starting server");

const testMode = argv["_"].indexOf("live") === -1;

import { ZWaveFactory } from "./ZWaveFactory";

const zwave: IZWave = new ZWaveFactory(testMode).create();

let api;

function stopProgramme() {
  Logger.info("disconnecting...");
  eventLogger.store({
    initiator: null,
    event: "Daemon stopped",
    data: null
  });
  api.stop();
  zwave.disconnect("/dev/ttyUSB0");
  redisInterface.cleanUp();
  eventLogger.stop();

  process.exit();
}

process.on("SIGINT", stopProgramme);
process.on("SIGTERM", stopProgramme);

const eventLogger = new EventLogger();

const redisInterface = new RedisInterface();

redisInterface.start();

(function() {
  let currentProgramme = null;
  let switchEnabled = true;

  eventLogger.start();

  eventLogger.store({
    initiator: null,
    event: "Daemon started",
    data: null
  });

  const myZWave = initMyZWave(zwave, config.lights);

  const programmeFactory = new ProgrammeFactory();

  const lights = new Map<string, Light>();

  forOwn(config.lights, (light, name) => {
    lights.set(name, new Light(light.id, light.displayName));
  });

  Logger.debug(`main: configuration: ${JSON.stringify(config)}`);
  const programmes: IProgramme[] = programmeFactory.build(objectToMap(config.programmes), lights);

  const stateMachines: Map<TimePeriod, TimeStateMachine> = new StateMachineBuilder(
    config.transitions,
    programmes
  ).call();

  const nextProgrammeChooser = new NextProgrammeChooser(new TimeService(config.periodStarts), stateMachines);

  const eventProcessor = new EventProcessor(myZWave, programmes, nextProgrammeChooser);

  const vacationMode = initVacationMode(TimeService, eventProcessor, redisInterface);

  api = RestServer({ vacationMode: vacationMode, myZWave: myZWave });

  api.setProgrammesListFinder(function() {
    return programmes;
  });

  api.setLightsListFinder(() => config.lights);

  api.setCurrentProgrammeFinder(function() {
    return currentProgramme;
  });

  api.onProgrammeChosen(function(programmeName) {
    eventProcessor.programmeSelected(programmeName);
  });

  api.setMainSwitchStateFinder(function() {
    return switchEnabled;
  });

  api.onSwitchStateChangeRequested(function(enabled) {
    if (enabled) {
      Logger.info("Enabling switch");
    } else {
      Logger.info("Disabling switch");
    }

    switchEnabled = enabled;
  });

  api.onHealNetworkRequested(function() {
    Logger.info("Requested healing the network");
    zwave.healNetwork();
  });

  api.onRefreshNodeRequested(function(nodeId) {
    zwave.refreshNodeInfo(nodeId);
  });

  api.onSimulateSwitchPressRequested(function(signal) {
    switchPressed(signal);
  });

  api.start();

  eventProcessor.on("programmeSelected", function(programmeName) {
    if (programmeName) {
      Logger.debug(`Storing new currentProgramme "${programmeName}"`);
      currentProgramme = programmeName;

      eventLogger.store({
        initiator: "event processor",
        event: "programme selected",
        data: programmeName
      });
    } else {
      Logger.error("Invalid programmeName (null/undefined) received from eventProcessor");
    }
  });

  redisInterface.getVacationMode().then(function(data) {
    if (data.state === "on") {
      Logger.info("Vacation mode was still on. Enabling.");

      vacationMode.start(data.start_time, data.end_time);
    }
  });

  myZWave.connect();

  function switchPressed(event) {
    if (switchEnabled) {
      eventProcessor.mainSwitchPressed(event, currentProgramme);
      eventLogger.store({
        initiator: "wall switch",
        event: "switch pressed",
        data: event === 255 ? "on" : "off"
      });
    } else {
      Logger.warn("Switch pressed but temporarily disabled.");
    }
  }

  function initMyZWave(zwave: IZWave, lights): MyZWave {
    const myZWave = new MyZWave(zwave);

    myZWave.onValueChange(function(node, commandClass, value) {
      if (node.nodeId === 3) {
        Logger.error(
          "ERROR: Main switch is now probably ignored by OpenZWave. Exiting process so it can be restarted."
        );

        throw "Main switch erroneously ignored. Exiting!";
      }

      const lightName = findKey(lights, function(light) {
        return light.id === node.nodeId;
      });

      if (!lightName) {
        Logger.error(`Unknown light with nodeId ${node.nodeId}. Command class: ${commandClass}, value: "${value}"`);

        return;
      } else if (!lights[lightName]) {
        Logger.error(
          `Unknown light with name "${lightName}" (id: ${
            node.nodeId
          }). Command class: ${commandClass}, value: "${value}"`
        );

        return;
      }

      if (!lights[lightName].values) {
        lights[lightName].values = {};
      }
      lights[lightName].values[commandClass] = value;

      Logger.debug(`Received value change from ${node.nodeId}`);

      const valueToString = `${value.value_id}, ${value.label}`;
      Logger.debug(`New value for node ${node.nodeId}: ${valueToString}`);
    });

    myZWave.onNodeEvent(function(node, event) {
      Logger.debug(`Event from node ${node.nodeId}`);
      if (node.nodeId === 3) {
        switchPressed(event);
      } else {
        Logger.warn(`Event from unexpected node ${node.nodeId}, event: ${event}`);
      }
    });

    return myZWave;
  }

  function initVacationMode(TimeService, eventProcessor, redisInterface) {
    const vacationMode = new VacationMode(
      new TimeService(config.periodStarts),
      () => {
        eventProcessor.programmeSelected("evening");
      },
      () => {
        eventProcessor.programmeSelected("off");
      }
    );

    vacationMode.onStart(function(meanStartTime, meanEndTime) {
      redisInterface.vacationModeStarted(meanStartTime, meanEndTime);
    });

    vacationMode.onStop(function() {
      redisInterface.vacationModeStopped();
    });

    return vacationMode;
  }
})();

function objectToMap(input: object): Map<string, object> {
  const result = new Map<string, object>();

  forOwn(input, (value, key) => {
    result.set(key, value);
  });

  return result;
}
