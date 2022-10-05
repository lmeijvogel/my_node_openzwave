import { AutomaticRunner } from '../automatic_runner';
import { TimeService } from '../time_service';
import * as assert from 'assert';

let called = false;

let timeService = new TimeService({periodStarts: []});

const fn = function () {
  called = true;
};

describe('AutomaticRunner', function () {
  beforeEach(function () {
    called = false;
  });

  describe('when it is later than the start time', function () {
    describe('but before the random offset', function () {
      it('does not run the function', function () {
        const mockTimeService = {
          currentTime: function () {
            return timeService.stringToTimeToday('18:01');
          },
          stringToTimeToday: timeService.stringToTimeToday
        };

        const starter = new AutomaticRunner(fn, {
          periodStart: '18:00',
          periodEnd: '20:00',
          offsetProvider: () => 12,
          timeService: mockTimeService
        });

        starter.tick();

        assert.equal(called, false);
      });
    });

    describe('and after the random offset', function () {
      it('runs the function', function () {
        const mockTimeService = {
          currentTime: function () {
            return timeService.stringToTimeToday('18:15');
          },
          stringToTimeToday: timeService.stringToTimeToday
        };

        const starter = new AutomaticRunner(fn, {
          periodStart: '18:00',
          periodEnd: '20:00',
          offsetProvider: () => 12,
          timeService: mockTimeService
        });

        starter.tick();

        assert.equal(called, true);
      });
    });

    describe('and also later than the end time', function () {
      it('runs the function', function () {
        const mockTimeService = {
          currentTime: function () {
            return timeService.stringToTimeToday('20:00');
          },
          stringToTimeToday: timeService.stringToTimeToday
        };

        const starter = new AutomaticRunner(fn, {
          periodStart: '18:00',
          periodEnd: '20:00',
          offsetProvider: () => 12,
          timeService: mockTimeService
        });

        starter.tick();

        assert.equal(called, false);
      });
    });
  });

  describe('when it is too early', function () {
    it('does not run the function', function () {
      const mockTimeService = {
        currentTime: function () {
          return timeService.stringToTimeToday('17:00');
        },
        stringToTimeToday: timeService.stringToTimeToday
      };

      const starter = new AutomaticRunner(fn, {
        periodStart: '18:00',
        periodEnd: '20:00',
        offsetProvider: () => 12,
        timeService: mockTimeService
      });

      starter.tick();

      assert.equal(called, false);
    });
  });

  describe('when the function was run', function () {
    it('is not run again', function () {
      let currentTime   = '';
      let currentOffset = -100000;

      const mockTimeService = {
        currentTime: function () {
          let result = timeService.stringToTimeToday(currentTime);

          result.setDate(result.getDate());

          return result;
        },
        stringToTimeToday: timeService.stringToTimeToday
      };

      const offsetProvider = function () {
        return currentOffset;
      };

      const starter = new AutomaticRunner(fn, {
        periodStart: '18:00',
        periodEnd: '20:00',
        offsetProvider: offsetProvider,
        timeService: mockTimeService
      });

      currentTime   = '18:15';
      currentOffset = 12;

      starter.tick();

      assert.equal(called, true, 'fn should have been run normally the first time.');

      called = false;

      // Pick a higher offset so we can test whether the function is triggered
      // on the old offset value (it shouldn't be).
      currentTime = '18:30';

      starter.tick();

      assert.equal(called, false, 'fn should not have been run the second time.');
    });
  });

  describe('when a new day starts', function () {
    it('gets a new random offset', function () {
      let currentTime   = '';
      let currentDay    = -100000;
      let currentOffset = -100000;

      const mockTimeService = {
        currentTime: function () {
          let result = timeService.stringToTimeToday(currentTime);

          result.setDate(result.getDate() + currentDay);

          return result;
        },
        stringToTimeToday: timeService.stringToTimeToday
      };

      const offsetProvider = function () {
        return currentOffset;
      };

      const starter = new AutomaticRunner(fn, {
        periodStart: '18:00',
        periodEnd: '20:00',
        offsetProvider: offsetProvider,
        timeService: mockTimeService
      });

      currentTime   = '18:15';
      currentOffset = 12;

      starter.tick();

      assert.equal(called, true, 'fn should have been run normally the first time.');

      // Pick a higher offset so we can test whether the function is triggered
      // on the old offset value (it shouldn't be).
      currentDay  = 1;
      currentTime = '17:00';
      currentOffset = 35;

      called = false;

      starter.tick();

      currentTime = '18:15';

      starter.tick();

      assert.equal(called, false, 'offset should have been renewed.');

      currentTime = '18:36';

      starter.tick();

      assert.equal(called, true);
    });
  });
});
