'use strict';

const fs = require('fs');

class ConfigReader {
  read(filename) {
    const contents = fs.readFileSync(filename, 'utf8');

    return JSON.parse(contents);
  }
}

module.exports = ConfigReader;
