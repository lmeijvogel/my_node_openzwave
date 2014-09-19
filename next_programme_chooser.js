var classy = require('classy');
var TimeStateMachine = require('./time_state_machine');

var NextProgrammeChooser = classy.define({
  programme: null,
  stateMachines: null,

  currentState: null,

  init: function() {
    this.stateMachines = this.buildStateMachines();
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
    if (this.isEvening()) {
      return this.stateMachines.evening;
    } else if (this.isMorning()) {
      return this.stateMachines.morning;
    } else if (this.isNight()) {
      return this.stateMachines.night;
    } else {
      console.log("WARNING: Unknown time");
      return this.stateMachines.morning;
    }
  },

  isMorning: function() {
    return (7 <= this.hour() && this.hour() < 14);
  },

  isEvening: function() {
    return (14 <= this.hour() && this.hour() < 22);
  },

  isNight: function() {
    return (this.hour() < 7 || 22 <= this.hour());
  },

  hour: function() {
    return new Date().getHours();
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
