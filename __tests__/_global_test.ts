import { Logger } from '../logger';

beforeEach(function () {
  Logger.setSilent(true);
});

afterEach(function () {
  Logger.setSilent(false);
});
