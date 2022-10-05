import { IZWave } from "./IZWave";
import { IMyZWave, NodeEventHandler, ValueChangeEventHandler } from "./IMyZWave";
import { Node } from "./Node";
import { Logger } from "./Logger";
import { NodeInfo } from "./NodeInfo";
import { ValueId } from "./ValueId";

const DEVICE_PATH = "/dev/ttyUSB0";

export class MyZWave implements IMyZWave {
  private readonly nodes: object[];

  private readonly valueChangeEventListeners: ValueChangeEventHandler[] = [];
  private readonly nodeEventListeners: NodeEventHandler[] = [];

  private scanComplete: boolean;

  constructor(private readonly zwave: IZWave) {
    this.nodes = [];

    this.scanComplete = false;
  }

  registerEvents() {
    this.zwave.on("driver ready", (homeId: string) => {
      Logger.verbose(`Scanning homeid=0x${homeId}...`);
    });

    this.zwave.on("driver failed", () => {
      Logger.error("Failed to start driver");
      this.zwave.disconnect(DEVICE_PATH);
      process.exit();
    });

    this.zwave.on("node added", (nodeId: number) => {
      this.addNode(nodeId);
      Logger.verbose(`Added node ${nodeId}`);
    });

    this.zwave.on("value added", (nodeId: number, commandClass: number, value: ValueId) => {
      const node = Node.find(nodeId);

      node.addValue(commandClass, value);
    });

    this.zwave.on("value changed", (nodeId: number, commandClass: number, value: ValueId) => {
      const node = Node.find(nodeId);

      node.setValue(commandClass, value);

      this.valueChangeEventListeners.forEach(handler => handler(node, commandClass, value) );
    });

    this.zwave.on("value removed", (nodeId: number, commandClass: number, index: number) => {
      const node = Node.find(nodeId);

      node.removeValue(commandClass, index);
    });

    this.zwave.on("node ready", (nodeId: number, nodeinfo: NodeInfo) => {
      this.nodeReady(nodeId, nodeinfo);
    });

    this.zwave.on("notification", (nodeId: number, notif: number) => {
      switch (notif) {
        case 0:
          Logger.info(`node ${nodeId}: message complete`);
          break;
        case 1:
          Logger.warn(`node ${nodeId}: timeout`);
          break;
        case 2:
          Logger.info(`node ${nodeId}: nop`);
          break;
        case 3:
          Logger.info(`node ${nodeId}: node awake`);
          break;
        case 4:
          Logger.info(`node ${nodeId}: node sleep`);
          break;
        case 5:
          Logger.warn(`node ${nodeId}: node dead`);
          break;
        case 6:
          Logger.info(`node ${nodeId}: node alive`);
          break;
        default:
          Logger.info(`node ${nodeId}: unexpected message (nothing serious)`);
          break;
      }
    });

    this.zwave.on("node event", (nodeId: number, event: number) => {
      Logger.verbose(`node ${nodeId}: event: ${event}`);

      const node = Node.find(nodeId);

      this.nodeEventListeners.forEach(handler => handler(node, event));
    });

    this.zwave.on("neighbors", (nodeId: number, neighbors: string[]) => {
      const formattedNeighbors = neighbors.join(", ");

      Logger.info(`node ${nodeId}: neighbors: [ ${formattedNeighbors} ]`);
    });

    this.zwave.on("scan complete", () => {
      this.scanComplete = true;

      Logger.info("Scan complete, ready to accept commands.");
    });
  }

  connect() {
    this.registerEvents();
    this.zwave.connect(DEVICE_PATH);
  }

  onNodeEvent(handler: NodeEventHandler) {
    this.nodeEventListeners.push(handler);
  }

  onValueChange(handler: ValueChangeEventHandler) {
    this.valueChangeEventListeners.push(handler);
  }

  addNode(nodeId: number) {
    Node.add(nodeId);
    this.nodes[nodeId] = {
      manufacturer: "",
      manufacturerid: "",
      product: "",
      producttype: "",
      productid: "",
      type: "",
      name: "",
      loc: "",
      classes: {},
      ready: false
    };
  }

  nodeReady(nodeId: number, _nodeinfo: NodeInfo) {
    const node = Node.find(nodeId);

    node.setReady();
    Logger.debug(`Node ready, node: ${node}`);

    if (node.isPollable()) {
      Logger.debug(".. enabling poll");
      this.enablePoll(node);
    }
  }

  enablePoll(node: Node) {
    const pollableClasses = node.pollableClasses();

    pollableClasses.forEach(commandClass => {
      const valueId = {
        node_id: node.nodeId,
        class_id: commandClass,
        instance: 1,
        index: 0
      };

      this.zwave.enablePoll(valueId, 2);
    });
  }

  setLevel(nodeId: number, level: number) {
    if (this.scanComplete) {
      this.zwave.setValue(nodeId, 38, 1, 0, level);
    } else {
      Logger.info("Not setting level: Initial scan not yet completed.");
    }
  }

  switchOn(nodeId: number) {
    if (this.scanComplete) {
      this.zwave.setValue(nodeId, 37, 1, 0, true);
    } else {
      Logger.info("Not switching on: Initial scan not yet completed.");
    }
  }

  switchOff(nodeId: number) {
    if (this.scanComplete) {
      this.zwave.setValue(nodeId, 37, 1, 0, false);
    } else {
      Logger.info("Not switching off: Initial scan not yet completed.");
    }
  }

  healNetwork() {
    this.zwave.healNetwork();
  }
}
