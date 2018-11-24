import { Node } from "./Node";

export interface IMyZWave {
    registerEvents(): void;

    connect(): void;

    onNodeEvent(handler): void;

    onValueChange(handler): void;

    addNode(nodeid: number): void;

    nodeReady(nodeid: number, nodeinfo): void;

    enablePoll(node: Node): void;

    setLevel(nodeid: number, level: number): void;

    switchOn(nodeid: number): void;

    switchOff(nodeid: number): void;

    healNetwork(): void;
}
