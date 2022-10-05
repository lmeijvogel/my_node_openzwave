"use strict";

var fs = require("fs");

function ConfigReader() {
  function read(filename) {
    var contents = fs.readFileSync(filename, "utf8");

    return JSON.parse(contents);
  }

  return {
    read: read
  };
}

module.exports = ConfigReader;
