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

    _programmes: IProgramme[];
    _lights: ConfigLight[];


    constructor(private json: any) {
        this._lights = this.buildLights()
        this._programmes = this.buildProgrammes(this._lights);
    }

    reloadFromFile(filename: string) {
        const contents = readFileSync(filename, 'utf8');

        this.json = JSON.parse(contents);

        this._lights = this.buildLights()
        this._programmes = this.buildProgrammes(this._lights);
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
        return this._lights;
    }

    findLightByName(name: string): ConfigLight | undefined {
        return this.lights.find(light => light.name === name);
    }

    findLightById(id: number): ConfigLight | undefined {
        return this.lights.find(light => light.id === id);
    }

    buildLights(): ConfigLight[] {
        const result: ConfigLight[] = [];

        forOwn(this.json["lights"], (light: ConfigLight, name: string) => {
            result.push(new ConfigLight(light.id, name, light.displayName, light.values));
        });

        return result;
    }

    /* Pass in lights as a parameter to make it more apparent that
     * those should be built before the programmes. */
    buildProgrammes(lights: ConfigLight[]): IProgramme[] {
        return ProgrammeFactory.build(this.objectToMap(this.json["programmes"]), lights);
    }

    get periodStarts() {
        return this.json["periodStarts"];
    }

    get programmes(): IProgramme[] {
        return this._programmes;
    }

    get transitions() {
        return this.json["transitions"];
    }

    get zwaveDevicePath() {
        return this.json["zwaveDevicePath"];
    }

    private objectToMap<T>(input: object): Map<string, T> {
        const result = new Map<string, T>();

        forOwn(input, (value: T, key: string) => {
            result.set(key, value);
        });

        return result;
    }
}
