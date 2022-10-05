export interface IZWave {
    on(eventName: string, callback: any): void;

    connect(path: string): void;

    disconnect(path: string): void;

    setNodeLevel(nodeId: number, level: number): void;

    setNodeOn(nodeId: number): void;
    setNodeOff(nodeId): void;

    setValue(nodeId, commandClass, instance, index, value): void;
    refreshNodeInfo(nodeid): void;

    healNetwork(): void;

    enablePoll(nodeid, commandClass): void;
}
