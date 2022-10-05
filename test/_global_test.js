'use strict';

const Logger = require('../logger');

before(function () {
  Logger.setSilent(true);
});

after(function () {
  Logger.setSilent(false);
});
