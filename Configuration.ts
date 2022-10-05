import { readFileSync } from 'fs';
import { forOwn } from "lodash";

import { ConfigLight } from "./ConfigLight";
import { IProgramme } from "./Programme";
import { ProgrammeFactory } from "./ProgrammeFactory";

export class Configuration {
    static fromFile(filename: string): Configuration {
        const contents = readFileSync(filename, 'utf8');

        return new Configuration(JSON.parse(contents));
    }

    constructor(private json: any) { }

    reloadFromFile(filename: string) {
        const contents = readFileSync(filename, 'utf8');

        this.json = JSON.parse(contents);
    }

    get logFilename(): string {
        return this.json["log"]["file"];
    }

    get logLevel(): string {
        return this.json["log"]["level"];
    }

    get mainSwitchId(): number {
        return this.json["switches"]["main"];
    }

    get lights(): ConfigLight[] {
        const result: ConfigLight[] = [];

        forOwn(this.json["lights"], (light: ConfigLight, name: string) => {
            result.push(new ConfigLight(light.id, name, light.displayName, light.values));
        });

        return result;
    }

    findLightByName(name: string): ConfigLight | undefined {
        return this.lights.find(light => light.name === name);
    }

    findLightById(id: number): ConfigLight | undefined {
        return this.lights.find(light => light.id === id);
    }

    get periodStarts() {
        return this.json["periodStarts"];
    }

    get programmes(): IProgramme[] {
        const programmeFactory = new ProgrammeFactory();

        return programmeFactory.build(this.objectToMap(this.json["programmes"]), this.lights);
    }

    get transitions() {
        return this.json["transitions"];
    }

    private objectToMap<T>(input: object): Map<string, T> {
        const result = new Map<string, T>();

        forOwn(input, (value: T, key: string) => {
            result.set(key, value);
        });

        return result;
    }
}
