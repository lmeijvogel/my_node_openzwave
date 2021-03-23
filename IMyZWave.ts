import { Node, ValueId } from "./Node";

export type ValueChangeEventHandler = (node: Node, commandClass: string, value: ValueId) => void;
export type NodeEventHandler = (node: Node, event: number) => void;

export interface IMyZWave {
    registerEvents(): void;

    connect(): void;

    onNodeEvent(handler: NodeEventHandler): void;

    onValueChange(handler: ValueChangeEventHandler): void;

    addNode(nodeid: number): void;

    nodeReady(nodeid: number, nodeinfo): void;

    enablePoll(node: Node): void;

    setLevel(nodeid: number, level: number): void;

    switchOn(nodeid: number): void;

    switchOff(nodeid: number): void;

    healNetwork(): void;
}
