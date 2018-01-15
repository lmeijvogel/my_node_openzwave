'use strict';

import * as _ from 'lodash';
import * as assert from 'assert';

import TimeService from '../time_service';

let timeService = new TimeService({});

describe('TimeServiceTest', function () {
  beforeEach(function () {
    const periodStarts = {
      '00:00': 'night',
      '07:00': 'morning',
      '14:00': 'evening',
      '22:30': 'night'
    };

    timeService = new TimeService(periodStarts);
  });

  // Primarily, test the behaviour at boundaries (and some more)
  const inputOutputs = [
    [ 0,  0, 'night'],
    [ 6, 59, 'night'],
    [ 7,  0, 'morning'],
    [ 8, 30, 'morning'],
    [15, 30, 'evening'],
    [22, 29, 'evening'],
    [22, 30, 'night'],
    [23, 59, 'night'],
  ];

  _.each(inputOutputs, function (data) {
    const hour     = data[0];
    const minute   = data[1];
    const expected = data[2];

    describe('when the time is ' + hour + ':' + minute, function () {
      it('should return ' + expected, function () {
        const date = createDate(hour, minute);

        const period = timeService.getPeriod(date);

        assert.equal(period, expected);
      });
    });
  });
});

function createDate(hours,minutes) {
  let date = new Date();

  date.setHours(hours);
  date.setMinutes(minutes);

  return date;
};
