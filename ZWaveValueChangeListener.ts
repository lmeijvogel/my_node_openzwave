import { Configuration } from "./Configuration";

import { Logger } from "./Logger";
import { Node } from "./Node";
import { MyZWave } from "./MyZWave";

export class ZWaveValueChangeListener {
    switchPressed: (node: Node, sceneId: number) => void = (_node, _sceneId) => {};

    constructor(private readonly myZWave: MyZWave, private config: Configuration) {}

    init() {
        this.myZWave.onValueChange(this.onValueChange);
    }

    isSceneEvent(commandClass: number): boolean {
        return commandClass === 43;
    }

    private onValueChange = (node: Node, commandClass, value) => {
        if (node.nodeId === 3) {
            Logger.error(
                "ERROR: Main switch is now probably ignored by OpenZWave. Exiting process so it can be restarted."
            );

            throw "Main switch erroneously ignored. Exiting!";
        }

        const lightById = this.config.findLightById(node.nodeId);

        if (!lightById) {
            Logger.error(`Unknown light with nodeId ${node.nodeId}. Command class: ${commandClass}, value: "${JSON.stringify(value)}"`);

            return;
        }

        const lightName = lightById.name;
        const light = this.config.findLightByName(lightName);

        if (!light) {
            Logger.error(
                `Unknown light with name "${lightName}" (id: ${
                    node.nodeId
                }). Command class: ${commandClass}, value: "${JSON.stringify(value)}"`
            );

            return;
        }

        if (this.isSceneEvent(parseInt(commandClass, 10))) {
            const sceneId = parseInt(value.value, 10);
            Logger.debug(`Received scene event from ${lightName}: sceneId: ${sceneId}`);

            this.switchPressed(node, sceneId);

            return;
        }

        light.values[commandClass] = value;

        Logger.debug(`Received value change from ${node.nodeId}. Raw value: ${JSON.stringify(value)}`);

        const valueToString = `${value.value_id}, ${value.label}`;
        Logger.debug(`New value for node ${node.nodeId}: ${valueToString}`);

        this.myZWave.onNodeEvent((node: Node, event: number) => {
            Logger.debug(`Event from node ${node.nodeId}: ${event}. No longer processed.`);
        });
    }
}
