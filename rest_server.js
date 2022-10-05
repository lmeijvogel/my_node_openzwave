'use strict';

const Logger = require('./logger');
const express = require('express');

module.exports = function (options) {
  const app = express();
  const port = 3000;

  let programmeChosenCallbacks = [];

  let programmesListFinderCallback = function () {};
  let lightsListFinderCallback = function() {};

  let programmes = {};

  const vacationMode = options.vacationMode;
  const myZWave = options.myZWave;

  app.get('/programmes', (req, res) => {
    res.send({programmes: programmesListFinderCallback()});
  });

  app.post('/programmes/:name/start', (req, res) => {
    programmeChosenCallbacks.forEach( (callback) => { callback.call(null, req.params.name) });

    res.send({ currentProgramme: req.params.name });
  });

  app.get('/vacation_mode', (req, res) => {
    res.send(vacationMode.getState());
  });

  app.post('/vacation_mode/off', (req, res) => {
    vacationMode.stop();
    Logger.info('Stopped vacation mode');

    res.send({state: false});
  });

  app.post('/vacation_mode/on/:mean_start_time(\\d\\d:\\d\\d)/:mean_end_time(\\d\\d:\\d\\d)', (req, res) => {
      vacationMode.start(req.params.mean_start_time, req.params.mean_end_time);
      Logger.info('Started Vacation mode. Mean start time:', req.params.mean_start_time, 'mean end time:', req.params.mean_end_time);

      res.send({state: true});
  });

  app.get('/nodes', (req, res) => {
    res.send({lights: lightsListFinderCallback()});
  });

  app.post('/nodes/:node_id(\\d+)/dim/:value(\\d+)', (req, res) => {
    const nodeId = req.params.node_id;
    const value  = req.params.value;

    myZWave.setLevel(nodeId, value);
    Logger.info('Dimming node', nodeId, '=>', value);

    res.send({node: nodeId, value: value});
  });

  app.post('/nodes/:node_id(\\d+)/switch/:state(on|off)', (req, res) => {
    const nodeId = req.params.node_id;

    if (req.params.state == "on") {
      myZWave.switchOn(nodeId);
      Logger.info('Switching node', nodeId, '=> on');
    } else {
      myZWave.switchOff(nodeId);
      Logger.info('Switching node', nodeId, '=> off');
    }

    res.send({node: nodeId, state: req.params.state == "on"});
  });

  const start = () => {
    app.listen(port);
    Logger.info("REST interface listening on port", port);
  };

  const stop = () => {
    app.close();
    Logger.info("Stopped REST interface");
  };

  const onProgrammeChosen = (callback) => {
    programmeChosenCallbacks.push(callback);
  };

  const setProgrammesListFinder = (callback) => {
    programmesListFinderCallback = callback;
  };

  const setLightsListFinder = (callback) => {
    lightsListFinderCallback = callback;
  };

  const setProgrammes = (newProgrammes) => {
    programmes = newProgrammes;
  };

  return {
    start: start,
    stop: stop,
    onProgrammeChosen: onProgrammeChosen,
    setProgrammesListFinder: setProgrammesListFinder,
    setLightsListFinder: setLightsListFinder
  }
}
