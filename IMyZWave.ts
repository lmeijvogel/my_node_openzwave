import { Node } from "./Node";
import { NodeInfo } from "./NodeInfo";
import { ValueId } from "./ValueId";

export type ValueChangeEventHandler = (node: Node, commandClass: number, value: ValueId) => void;
export type NodeEventHandler = (node: Node, event: number) => void;

export interface IMyZWave {
    registerEvents(): void;

    connect(): void;

    onNodeEvent(handler: NodeEventHandler): void;

    onValueChange(handler: ValueChangeEventHandler): void;

    addNode(nodeId: number): void;

    nodeReady(nodeId: number, nodeInfo: NodeInfo): void;

    enablePoll(node: Node): void;

    setLevel(nodeId: number, level: number): void;

    switchOn(nodeId: number): void;

    switchOff(nodeId: number): void;

    healNetwork(): void;
}
