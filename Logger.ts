import * as winston from "winston";
import * as Transport from "winston-transport";

import { each, map, padStart, values } from "lodash";

class WinstonLogger {
    private logger: winston.Logger;

    constructor() {
        this.logger = this.createLogger();
    }

    // Don't enable logging to file by default since it would then also do
    // that while running tests
    enableLogToFile(filename, level) {
        this.logger = this.createLogger(filename, level);
    }

    setSilent(silent) {
        each(this.logger.transports, transport => {
            transport.silent = silent;
        });
    }

    debug(message: string) {
        this._log("debug", message);
    }
    verbose(message: string) {
        this._log("verbose", message);
    }
    info(message: string) {
        this._log("info", message);
    }
    warn(message: string) {
        this._log("warn", message);
    }
    error(message: string) {
        this._log("error", message);
    }

    _log(level, message) {
        this.logger.log(level, message);
    }

    createLogger(filename = null, level = "info") {
        const transports: Transport[] = [new winston.transports.Console({ level: "debug" })];

        if (filename) {
            const fileLogger = new winston.transports.File({ filename: filename, level: level });
            transports.push(fileLogger);
        }

        return winston.createLogger({
            transports: transports,
        });
    }

    timestamp = () => {
        const now = new Date();

        let dateParts = [now.getFullYear(), now.getMonth(), now.getDate()];
        const timeParts = [now.getHours(), now.getMinutes(), now.getSeconds()];

        dateParts[1]++;

        const datePart = this.padToTwoZeros(dateParts).join("-");
        const timePart = this.padToTwoZeros(timeParts).join(":");

        return datePart + " " + timePart;
    };

    padToTwoZeros(parts) {
        return map(parts, val => padStart("" + val, 2, "0"));
    }
}

function mapToString(map: Map<string, any>): string {
    let result = "";

    map.forEach((value, key) => {
        let valueToString;
        if (value instanceof Map) {
            valueToString = mapToString(value);
        } else {
            valueToString = JSON.stringify(value);
        }
        result += `${key}: ${valueToString}`;
    });

    return result;
}

const Logger = new WinstonLogger();

export { Logger, mapToString };
