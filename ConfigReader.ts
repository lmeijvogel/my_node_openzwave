import { readFileSync } from 'fs';

class ConfigReader {
  read(filename: string) {
    const contents = readFileSync(filename, 'utf8');

    return JSON.parse(contents);
  }
}

export { ConfigReader };
