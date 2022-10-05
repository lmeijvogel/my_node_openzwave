import { Logger } from "./Logger";

import { Light } from "./Light";
import { IProgramme } from "./Programme";
import * as express from "express";

const RestServer = function(options) {
  const app = express();
  const port = 3000;

  let server;

  let programmeChosenCallbacks: ((name: string) => void)[] = [];
  let switchStateChangeRequestedCallbacks: ((newState: boolean) => void)[] = [];

  let programmesListFinderCallback: () => IProgramme[];
  let lightsListFinderCallback: () => Light[];
  let currentProgrammeFinderCallback: () => IProgramme;
  let switchStateFinderCallback: () => boolean;

  let onHealNetworkRequestedCallback: () => void;
  let onRefreshNodeRequestedCallback: (nodeid: number) => void;
  let onSimulateSwitchPressRequestedCallback: (signal: number) => void;

  let programmes = {};

  const vacationMode = options.vacationMode;
  const myZWave = options.myZWave;

  app.get("/programmes", (req, res) => {
    res.send({ programmes: programmesListFinderCallback() });
  });

  app.get("/programmes/current", (req, res) => {
    res.send({ programme: currentProgrammeFinderCallback() });
  });

  app.post("/programmes/:name/start", (req, res) => {
    programmeChosenCallbacks.forEach(callback => {
      callback(req.params.name);
    });

    res.send({ currentProgramme: req.params.name });
  });

  app.get("/vacation_mode", (req, res) => {
    res.send(vacationMode.getState());
  });

  app.post("/vacation_mode/off", (req, res) => {
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

  app.get("/nodes", (req, res) => {
    res.send({ lights: lightsListFinderCallback() });
  });

  app.post("/nodes/:node_id(\\d+)/dim/:value(\\d+)", (req, res) => {
    const nodeId = req.params.node_id;
    const value = req.params.value;

    myZWave.setLevel(nodeId, value);
    Logger.info(`Dimming node ${nodeId} => ${value}`);

    res.send({ node: nodeId, value: value });
  });

  app.post("/nodes/:node_id(\\d+)/switch/:state(on|off)", (req, res) => {
    const nodeId = req.params.node_id;

    if (req.params.state === "on") {
      myZWave.switchOn(nodeId);
      Logger.info(`Switching node ${nodeId} => on`);
    } else {
      myZWave.switchOff(nodeId);
      Logger.info(`Switching node ${nodeId} => off`);
    }

    res.send({ node: nodeId, state: req.params.state === "on" });
  });

  app.get("/main_switch/enabled", (req, res) => {
    res.send({ state: switchStateFinderCallback() });
  });

  app.post("/main_switch/enabled/:state", (req, res) => {
    const newState = req.params.state === "on";

    switchStateChangeRequestedCallbacks.forEach(callback => callback(newState));
    res.send({ state: newState });
  });

  app.post("/debug/heal_network", (req, res) => {
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
    // Only bind to localhost, so I don't have to implement API tokens just yet :)
    server = app.listen(port, "localhost");
    Logger.info(`REST interface listening on port ${port}`);
  };

  const stop = () => {
    server.close();
    Logger.info("Stopped REST interface");
  };

  const onProgrammeChosen = (callback: (name) => void) => {
    programmeChosenCallbacks.push(callback);
  };

  const onSwitchStateChangeRequested = (callback: (newState: boolean) => void) => {
    switchStateChangeRequestedCallbacks.push(callback);
  };

  const onHealNetworkRequested = callback => {
    onHealNetworkRequestedCallback = callback;
  };

  const onRefreshNodeRequested = callback => {
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

  const setCurrentProgrammeFinder = (callback: () => IProgramme) => {
    currentProgrammeFinderCallback = callback;
  };

  const setLightsListFinder = (callback: () => Light[]) => {
    lightsListFinderCallback = callback;
  };

  const setProgrammes = newProgrammes => {
    programmes = newProgrammes;
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
