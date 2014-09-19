var classy = require('classy');
var TimeService = require('./time_service');
var TimeStateMachine = require('./time_state_machine');

var NextProgrammeChooser = classy.define({
  programme: null,
  stateMachines: null,
  timeService: null,

  currentState: null,

  init: function() {
    this.stateMachines = this.buildStateMachines();
    this.timeService = new TimeService();
  },

  setProgramme: function(programme) {
    this.programme = programme;
  },

  handle: function(event) {
    var currentStateMachine = this.chooseStateMachine();
    currentStateMachine.setState(this.currentState);

    this.currentState = currentStateMachine.handle(event);

    console.log("Entering state", this.currentState);
    return this.currentState;
  },

  chooseStateMachine: function() {
    if (this.timeService.isEvening()) {
      return this.stateMachines.evening;
    } else if (this.timeService.isMorning()) {
      return this.stateMachines.morning;
    } else if (this.timeService.isNight()) {
      return this.stateMachines.night;
    } else {
      console.log("WARNING: Unknown time");
      return this.stateMachines.morning;
    }
  },

  buildStateMachines: function() {
    var result = {};

    result.evening = new TimeStateMachine({
      on: {
        default: "evening",
        evening: "dimmed"
      }
    });

    result.morning = new TimeStateMachine({
      on: {
        default: "morning"
      }
    });

    result.night = new TimeStateMachine({
      on: {
        default: "night"
      }
    });

    return result;
  }
});

module.exports = NextProgrammeChooser;
