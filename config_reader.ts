import * as fs from 'fs';

class ConfigReader {
  read(filename) {
    const contents = fs.readFileSync(filename, 'utf8');

    return JSON.parse(contents);
  }
}

export { ConfigReader };
