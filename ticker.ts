import { Logger } from "./logger";

class Ticker {
  private readonly name: String;
  ticker: any | null;

  constructor(name) {
    this.ticker = null;
    this.name = name;
  }

  start(callable, interval: number) {
    Logger.debug(`Ticker.start: Entered for "${this.name}", interval: ${interval}`);
    if (!interval) {
      throw "No interval defined!";
    }

    if (!this.ticker) {
      Logger.debug("Ticker.start: No ticker yet, starting");
      this.ticker = setInterval(function() {
        callable.tick();
      }, interval);

      Logger.debug(`Ticker.start: Ticker "${this.name}" started`);
    }
  }

  stop() {
    Logger.debug(`Ticker.stop: Entered for "${this.name}"`);
    if (this.ticker) {
      Logger.debug("Ticker.stop: Ticker exists, stopping");
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }
}

export { Ticker };
