import { Logger } from '../Logger';

beforeEach(function () {
  Logger.setSilent(true);
});

afterEach(function () {
  Logger.setSilent(false);
});
