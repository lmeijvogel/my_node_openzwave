_      = require('lodash');
assert = require('assert');
NextProgrammeChooser = require('../next_programme_chooser');

stub = function(result) {
  return function() { return result; }
};

handlesOnButton = function(current, expected) {
  beforeEach(function() {
    this.subject.setProgramme(current);
  });

  context("when 'on' is pressed", function() {
    it("switches to the "+expected+" programme", function() {
      var result = this.subject.handle("on");

      assert.equal(result, expected);
    });
  });
};
handlesOffButton = function(current) {
  describe("when 'off' is pressed", function() {
    beforeEach(function() {
      this.subject.programme = current;
    });

    it("turns the lights off", function() {
      var result = this.subject.handle("off");

      assert.equal(result, "off");
    });
  });
};

describe("NextProgrammeChooser", function() {
  beforeEach(function() {
    var self = this;

    this.subject = new NextProgrammeChooser();

    _(["isMorning", "isEvening", "isNight"]).each(function(method) {
      self.subject[method] = stub(false);
    });
  });

  describe("handle", function() {
    context("when the lights are off", function() {
      context("when it is evening", function() {
        beforeEach(function() {
          this.subject.isEvening = stub(true);
        });

        handlesOnButton("off", "evening");
        handlesOffButton("evening");
      });

      context("when it is morning", function() {
        beforeEach(function() {
          this.subject.isMorning = stub(true);
        });

        handlesOnButton("off", "morning");
        handlesOffButton("morning");
      });

      context("when it is night", function() {
        beforeEach(function() {
          this.subject.isNight   = stub(true);
        });

        handlesOnButton("off", "night");
        handlesOffButton("night");
      });
    });

    context("the current programme is 'evening'", function() {
      handlesOnButton("evening", "dimmed");
    });

    context("the current programme is 'dimmed'", function() {
      handlesOnButton("dimmed", "evening");
    });
  });
});
