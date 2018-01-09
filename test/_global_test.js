'use strict';

import Logger from '../logger';

before(function () {
  Logger.setSilent(true);
});

after(function () {
  Logger.setSilent(false);
});
