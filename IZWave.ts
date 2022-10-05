import { ValueId } from "./Node";

export interface IZWave {
  on(eventName: string, callback: any): void;

  connect(path: string): void;

  disconnect(path: string): void;

  setValue(nodeid: number, commandClass: number, instance: number, index: number, value: number | boolean);

  refreshNodeInfo(nodeid): void;

  healNetwork(): void;

  enablePoll(valueId: ValueId, pollIntensity: number): boolean;
}
