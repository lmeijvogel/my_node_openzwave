import { RestServer } from "./RestServer";
import * as minimist from "minimist";
import { forOwn } from "lodash";
import { IZWave } from "./IZWave";

import { ConfigLight } from "./ConfigLight";
import { MyZWave } from "./MyZWave";
import { Light } from "./Light";
import { IProgramme } from "./Programme";
import { ProgrammeFactory } from "./ProgrammeFactory";
import { TimeStateMachine } from "./TimeStateMachine";
import { StateMachineBuilder } from "./StateMachineBuilder";
import { SwitchPressName } from "./SwitchPressName";
import { ZWaveValueChangeListener } from "./ZWaveValueChangeListener";

import { TimeService, TimePeriod } from "./TimeService";

import { Node } from "./Node";
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

  forOwn(config.lights, (light: ConfigLight, name: string) => {
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

  api.onProgrammeChosen((programmeName: string) => {
    eventProcessor.programmeSelected(programmeName);
  });

  api.setMainSwitchStateFinder(() => switchEnabled );

  api.onSwitchStateChangeRequested((enabled: boolean) => {
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

  api.onRefreshNodeRequested((nodeId: number) => {
    zwave.refreshNodeInfo(nodeId);
  });

  api.onSimulateSwitchPressRequested(function(signal: number) {
    mainSwitchPressed(signal);
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

  function mainSwitchPressed(sceneId: number) {
    if (!switchEnabled) {
      Logger.warn("Switch pressed but temporarily disabled.");
      return;
    }

    const switchPressName = mainSceneIdToSwitchPressName(sceneId);

    if (switchPressName === SwitchPressName.SceneReturn) {
        return;
    }

    eventProcessor.mainSwitchPressed(switchPressName, currentProgramme);

    eventLogger.store({
      initiator: "main switch",
      event: "switch pressed",
      data: switchPressName
    });
  }

  function mainSceneIdToSwitchPressName(sceneId: number): SwitchPressName {
    switch (sceneId) {
      case 0:
        return SwitchPressName.SceneReturn;
      case 10:
        return SwitchPressName.SingleOn;
      case 11:
        return SwitchPressName.SingleOff;
      case 14:
        return SwitchPressName.Double; // This is the same for up and down
      case 17:
        return SwitchPressName.HoldOn;
      case 18:
        return SwitchPressName.HoldOff;
      default:
        return SwitchPressName.Unknown;
    }
  }

  function auxSwitchPressed(_node: Node, sceneId: number) {
    if (!switchEnabled) {
      Logger.warn("Switch pressed but temporarily disabled.");
      return;
    }

    Logger.warn("Aux switch pressed: Not implemented yet");

    const switchPressName = mainSceneIdToSwitchPressName(sceneId);

    if (switchPressName === SwitchPressName.SceneReturn) {
        return;
    }

    eventProcessor.auxSwitchPressed(currentProgramme);

    eventLogger.store({
      initiator: "aux switch",
      event: "switch pressed",
      data: switchPressName
    });
  }


  function initMyZWave(zwave: IZWave, lights: ConfigLight[]): MyZWave {
    const myZWave = new MyZWave(zwave);

    const listener = new ZWaveValueChangeListener(myZWave, lights);

      listener.switchPressed = (node: Node, sceneId: number) => {
        if (node.nodeId === config.switches["main"]) {
            mainSwitchPressed(sceneId);
        } else {
            auxSwitchPressed(node, sceneId);
        }
      }

    return myZWave;
  }

  function initVacationMode(TimeService, eventProcessor: EventProcessor, redisInterface: RedisInterface) {
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

function objectToMap<T>(input: object): Map<string, T> {
  const result = new Map<string, T>();

  forOwn(input, (value: T, key: string) => {
    result.set(key, value);
  });

  return result;
}
