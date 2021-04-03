import { Logger } from "./Logger";

import { Light } from "./Light";
import { IProgramme } from "./Programme";
import { MyZWave } from "./MyZWave";
import { VacationMode } from "./VacationMode";
import * as express from "express";
import {Server} from "http";

export type IRestServer = {
    start: () => void;
    stop: () => void;
    onProgrammeChosen: (callback: (name: string) => void) => void;
    onSwitchStateChangeRequested: (callback: (newState: boolean) => void) => void;
    onHealNetworkRequested: (callback: () => void) => void;
    onRefreshNodeRequested: (callback: (nodeid: number) => void) => void;
    onSimulateSwitchPressRequested: (callback: (signal: number) => void) => void;
    setMainSwitchStateFinder: (callback: () => boolean) => void;
    setProgrammesListFinder: (callback: () => IProgramme[]) => void;
    setCurrentProgrammeFinder: (callback: () => string | null) => void;
    setLightsListFinder: (callback: () => Light[]) => void;
};

const RestServer = function(options : { vacationMode : VacationMode, myZWave: MyZWave }): IRestServer {
  const app = express();
  const port = 3000;

  let server: Server;

  let programmeChosenCallbacks: ((name: string) => void)[] = [];
  let switchStateChangeRequestedCallbacks: ((newState: boolean) => void)[] = [];

  let programmesListFinderCallback: () => IProgramme[];
  let lightsListFinderCallback: () => Light[];
  let currentProgrammeFinderCallback: () => string | null;
  let switchStateFinderCallback: () => boolean;

  let onHealNetworkRequestedCallback: () => void;
  let onRefreshNodeRequestedCallback: (nodeid: number) => void;
  let onSimulateSwitchPressRequestedCallback: (signal: number) => void;

  const vacationMode = options.vacationMode;
  const myZWave = options.myZWave;

  app.get("/programmes", (_req, res) => {
    res.send({ programmes: programmesListFinderCallback() });
  });

  app.get("/programmes/current", (_req, res) => {
    res.send({ programme: currentProgrammeFinderCallback() });
  });

  app.post("/programmes/:name/start", (req, res) => {
    programmeChosenCallbacks.forEach(callback => {
      callback(req.params.name);
    });

    res.send({ currentProgramme: req.params.name });
  });

  app.get("/vacation_mode", (_req, res) => {
    res.send(vacationMode.getState());
  });

  app.post("/vacation_mode/off", (_req, res) => {
    vacationMode.stop();
    Logger.info("Stopped vacation mode");

    res.send({ state: false });
  });

  app.post("/vacation_mode/on/:mean_start_time(\\d\\d:\\d\\d)/:mean_end_time(\\d\\d:\\d\\d)", (req, res) => {
    vacationMode.start(req.params.mean_start_time, req.params.mean_end_time);
    Logger.info(
      `Started Vacation mode. Mean start time: ${req.params.mean_start_time}, mean end time: ${
        req.params.mean_end_time
      }`
    );

    res.send({ state: true });
  });

  app.get("/nodes", (_req, res) => {
    res.send({ lights: lightsListFinderCallback() });
  });

  app.post("/nodes/:node_id(\\d+)/dim/:value(\\d+)", (req, res) => {
    const nodeId = parseInt(req.params.node_id);
    const value = parseInt(req.params.value);

    myZWave.setLevel(nodeId, value);
    Logger.info(`Dimming node ${nodeId} => ${value}`);

    res.send({ node: nodeId, value: value });
  });

  app.post("/nodes/:node_id(\\d+)/switch/:state(on|off)", (req, res) => {
    const nodeId = parseInt(req.params.node_id);

    if (req.params.state === "on") {
      myZWave.switchOn(nodeId);
      Logger.info(`Switching node ${nodeId} => on`);
    } else {
      myZWave.switchOff(nodeId);
      Logger.info(`Switching node ${nodeId} => off`);
    }

    res.send({ node: nodeId, state: req.params.state === "on" });
  });

  app.get("/main_switch/enabled", (_req, res) => {
    res.send({ state: switchStateFinderCallback() });
  });

  app.post("/main_switch/enabled/:state", (req, res) => {
    const newState = req.params.state === "on";

    switchStateChangeRequestedCallbacks.forEach(callback => callback(newState));
    res.send({ state: newState });
  });

  app.post("/debug/heal_network", (_req, res) => {
    onHealNetworkRequestedCallback();
    res.send({ status: "sent" });
  });

  app.post("/debug/refresh_node/:node_id(\\d+)", (req, res) => {
    onRefreshNodeRequestedCallback(parseInt(req.params.node_id));
    res.send({ status: "sent" });
  });

  app.post("/debug/simulate_switch_press/:signal(0|255)", (req, res) => {
    onSimulateSwitchPressRequestedCallback(parseInt(req.params.signal));

    res.send({ status: "sent" });
  });

  const start = () => {
    server = app.listen(port);
    Logger.info(`REST interface listening on port ${port}`);
  };

  const stop = () => {
    server.close();
    Logger.info("Stopped REST interface");
  };

  const onProgrammeChosen = (callback: (name: string) => void) => {
    programmeChosenCallbacks.push(callback);
  };

  const onSwitchStateChangeRequested = (callback: (newState: boolean) => void) => {
    switchStateChangeRequestedCallbacks.push(callback);
  };

  const onHealNetworkRequested = (callback: () => void) => {
    onHealNetworkRequestedCallback = callback;
  };

  const onRefreshNodeRequested = (callback: (nodeid: number) => void) => {
    onRefreshNodeRequestedCallback = callback;
  };

  const onSimulateSwitchPressRequested = (callback: (signal: number) => void) => {
    onSimulateSwitchPressRequestedCallback = callback;
  };

  const setMainSwitchStateFinder = (callback: () => boolean) => {
    switchStateFinderCallback = callback;
  };

  const setProgrammesListFinder = (callback: () => IProgramme[]) => {
    programmesListFinderCallback = callback;
  };

  const setCurrentProgrammeFinder = (callback: () => string | null) => {
    currentProgrammeFinderCallback = callback;
  };

  const setLightsListFinder = (callback: () => Light[]) => {
    lightsListFinderCallback = callback;
  };

  return {
    start: start,
    stop: stop,
    onProgrammeChosen: onProgrammeChosen,
    onSwitchStateChangeRequested: onSwitchStateChangeRequested,

    onHealNetworkRequested: onHealNetworkRequested,
    onRefreshNodeRequested: onRefreshNodeRequested,
    onSimulateSwitchPressRequested: onSimulateSwitchPressRequested,

    setMainSwitchStateFinder: setMainSwitchStateFinder,
    setProgrammesListFinder: setProgrammesListFinder,
    setCurrentProgrammeFinder: setCurrentProgrammeFinder,

    setLightsListFinder: setLightsListFinder
  };
};

export { RestServer };
