import { IRestServer, RestServer } from "./RestServer";
import * as minimist from "minimist";
import { IZWave } from "./IZWave";

import { Configuration } from "./Configuration";

import { MyZWave } from "./MyZWave";
import { TimeStateMachine } from "./TimeStateMachine";
import { StateMachineBuilder } from "./StateMachineBuilder";
import { mainSceneIdToSwitchPressName, SwitchPressName } from "./SwitchPressName";
import { ZWaveValueChangeListener } from "./ZWaveValueChangeListener";

import { TimeService, TimePeriod } from "./TimeService";

import { Node } from "./Node";
import { NextProgrammeChooser } from "./NextProgrammeChooser";

import { EventProcessor } from "./EventProcessor";
import { RedisInterface } from "./RedisInterface";
import { Logger } from "./Logger";
import { EventLogger } from "./EventLogger";

import { IProgramme } from "./Programme";

import { VacationMode } from "./VacationMode";

const argv = minimist(process.argv.slice(2));

// NOTE: The light values are stored in `config.lights`, which is confusing.
// Maybe change that?
const configFile = argv["config"] || "./config.json";
const config = Configuration.fromFile(configFile);

const logfileName = argv["logfile"] || config.logFilename || "./log/openzwave.log";

Logger.enableLogToFile(logfileName, (config.logLevel as any));

Logger.info("Starting server");

const testMode = argv["_"].indexOf("live") === -1;

import { ZWaveFactory } from "./ZWaveFactory";

const zwave: IZWave = new ZWaveFactory(testMode).create();

let api: IRestServer | null = null;

const stateMachineBuilder = new StateMachineBuilder(config);

const eventLogger = new EventLogger();

const redisInterface = new RedisInterface();

redisInterface.start();

let currentProgrammeName: string | null = null;
let switchEnabled = true;

(function() {
    eventLogger.start();

    eventLogger.store({
        initiator: null,
        event: "Daemon started",
        data: null
    });

    Logger.debug(`main: configuration: ${JSON.stringify(config)}`);

    const stateMachines: Map<TimePeriod, TimeStateMachine> = stateMachineBuilder.call();

    const nextProgrammeChooser = new NextProgrammeChooser(new TimeService(config), stateMachines);

    const eventProcessor = new EventProcessor(config, nextProgrammeChooser, (programme: IProgramme) => programme.apply(myZWave));

    const myZWave = initMyZWave(zwave, config, eventProcessor);

    const vacationMode = initVacationMode(eventProcessor, redisInterface);

    api = RestServer({ vacationMode: vacationMode, myZWave: myZWave });

    api.setProgrammesListFinder(() => config.programmes);
    api.setLightsListFinder(() => config.lights);
    api.setCurrentProgrammeFinder(() => currentProgrammeName);

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

    api.onSimulateSwitchPressRequested((signal: number) => {
        mainSwitchPressed(signal, eventProcessor);
    });

    api.start();

    function stopProgramme() {
        Logger.info("disconnecting...");
        eventLogger.store({
            initiator: null,
            event: "Daemon stopped",
            data: null
        });

        if (api) {
            api.stop();
        }

        myZWave.disconnect();
        redisInterface.cleanUp();
        eventLogger.stop();

        process.exit();
    }

    function reloadConfiguration() {
        Logger.info("Receiving SIGHUP: Reloading configuration");
        config.reloadFromFile(configFile);

        stateMachineBuilder.recheckConfiguration();
    }

    process.on("SIGINT", stopProgramme);
    process.on("SIGTERM", stopProgramme);
    process.on("SIGHUP", reloadConfiguration);

    eventProcessor.on("programmeSelected", function(programmeName: string) {
        if (programmeName) {
            Logger.debug(`Storing new currentProgrammeName "${programmeName}"`);
            currentProgrammeName = programmeName;

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
})();

function initVacationMode(eventProcessor: EventProcessor, redisInterface: RedisInterface) {
    const vacationMode = new VacationMode(
        new TimeService(config),
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

function initMyZWave(zwave: IZWave, config: Configuration, eventProcessor: EventProcessor): MyZWave {
    const myZWave = new MyZWave(zwave, config.zwaveDevicePath);

    const listener = new ZWaveValueChangeListener(myZWave, config);

    listener.switchPressed = (node: Node, sceneId: number) => {
        if (node.nodeId === config.mainSwitchId) {
            mainSwitchPressed(sceneId, eventProcessor);
        } else {
            auxSwitchPressed(node, sceneId, eventProcessor);
        }
    }

    return myZWave;
}

function mainSwitchPressed(sceneId: number, eventProcessor: EventProcessor) {
    if (!switchEnabled) {
        Logger.warn("Switch pressed but temporarily disabled.");
        return;
    }

    const switchPressName = mainSceneIdToSwitchPressName(sceneId);

    if (switchPressName === SwitchPressName.SceneReturn) {
        return;
    }

    eventProcessor.mainSwitchPressed(switchPressName, currentProgrammeName);

    eventLogger.store({
        initiator: "main switch",
        event: "switch pressed",
        data: switchPressName
    });
}

function auxSwitchPressed(_node: Node, sceneId: number, eventProcessor: EventProcessor) {
    if (!switchEnabled) {
        Logger.warn("Switch pressed but temporarily disabled.");
        return;
    }

    Logger.warn("Aux switch pressed: Not implemented yet");

    const switchPressName = mainSceneIdToSwitchPressName(sceneId);

    if (switchPressName === SwitchPressName.SceneReturn) {
        return;
    }

    eventProcessor.auxSwitchPressed(currentProgrammeName);

    eventLogger.store({
        initiator: "aux switch",
        event: "switch pressed",
        data: switchPressName
    });
}
