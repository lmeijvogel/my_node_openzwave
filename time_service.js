var _ = require('lodash');

function TimeService(config) {
  if (!config.periodStarts) {
    throw("No periodStarts defined in config");
  }

  var lookupTable = config.periodStarts;

  function getPeriod(now) {
    var candidateKeys = _.chain(_.keys(lookupTable)).select( function (k) {
      var periodStart = stringToTimeToday(k);

      return (periodStart < now);
    }).value();

    var key = _.last(candidateKeys);

    return lookupTable[key];
  }

  function stringToTimeToday(timeString) {
    var splittedString = timeString.split(":");
    var hoursMinutes = _.map(splittedString, function (str) {
      return parseInt(str, 10);
    });

    var hours = hoursMinutes[0];
    var minutes = hoursMinutes[1];

    var result = new Date();
    result.setHours(hours);
    result.setMinutes(minutes);
    result.setSeconds(0);

    return result;
  }

  return {
    getPeriod: getPeriod
  };
}

module.exports = TimeService;
