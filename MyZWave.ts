import { each } from "lodash";
import { IZWave } from "./IZWave";
import { IMyZWave } from "./IMyZWave";
import { Node, ValueId } from "./Node";
import { Logger } from "./Logger";

const DEVICE_PATH = "/dev/ttyUSB0";

type EventHandler = (node: Node, commandClass: number, value: ValueId) => void;

class MyZWave implements IMyZWave {
  private readonly nodes: object[];

  private readonly eventListeners: Map<string, EventHandler[]>;

  private scanComplete: boolean;

  constructor(private readonly zwave: IZWave) {
    this.nodes = [];

    this.eventListeners = new Map<string, EventHandler[]>();

    this.scanComplete = false;
  }

  registerEvents() {
    this.zwave.on("driver ready", homeid => {
      Logger.verbose(`Scanning homeid=0x${homeid}...`);
    });

    this.zwave.on("driver failed", () => {
      Logger.error("Failed to start driver");
      this.zwave.disconnect(DEVICE_PATH);
      process.exit();
    });

    this.zwave.on("node added", nodeid => {
      this.addNode(nodeid);
      Logger.verbose(`Added node ${nodeid}`);
    });

    this.zwave.on("value added", (nodeid, comclass, value) => {
      const node = Node.find(nodeid);

      node.addValue(comclass, value);
    });

    this.zwave.on("value changed", (nodeid: number, comclass, value) => {
      const node = Node.find(nodeid);

      node.setValue(comclass, value);

      each(this.eventListeners.get("valueChange"), handler => {
        handler.call(null, node, comclass, value);
      });
    });

    this.zwave.on("value removed", (nodeid: number, comclass, index) => {
      const node = Node.find(nodeid);

      node.removeValue(comclass, index);
    });

    this.zwave.on("node ready", (nodeid: number, nodeinfo) => {
      this.nodeReady(nodeid, nodeinfo);
    });

    this.zwave.on("notification", (nodeid: number, notif) => {
      switch (notif) {
        case 0:
          Logger.info(`node ${nodeid}: message complete`);
          break;
        case 1:
          Logger.warn(`node ${nodeid}: timeout`);
          break;
        case 2:
          Logger.info(`node ${nodeid}: nop`);
          break;
        case 3:
          Logger.info(`node ${nodeid}: node awake`);
          break;
        case 4:
          Logger.info(`node ${nodeid}: node sleep`);
          break;
        case 5:
          Logger.warn(`node ${nodeid}: node dead`);
          break;
        case 6:
          Logger.info(`node ${nodeid}: node alive`);
          break;
        default:
          Logger.info(`node ${nodeid}: unexpected message (nothing serious)`);
          break;
      }
    });

    this.zwave.on("node event", (nodeid: number, event) => {
      Logger.verbose(`node ${nodeid}: event: ${event}`);

      const node = Node.find(nodeid);

      each(this.eventListeners.get("node event"), handler => {
        handler.call(null, node, event);
      });
    });

    this.zwave.on("neighbors", (nodeid: number, neighbors) => {
      const formattedNeighbors = neighbors.join(", ");

      Logger.info(`node ${nodeid}: neighbors: [ ${formattedNeighbors} ]`);
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

  onNodeEvent(handler: EventHandler) {
    if (!this.eventListeners.has("node event")) {
      this.eventListeners.set("node event", []);
    }
    this.eventListeners.get("node event").push(handler);
  }

  onValueChange(handler: EventHandler) {
    if (!this.eventListeners.has("valueChange")) {
      this.eventListeners.set("valueChange", []);
    }
    this.eventListeners.get("valueChange").push(handler);
  }

  addNode(nodeid: number) {
    Node.add(nodeid);
    this.nodes[nodeid] = {
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

  nodeReady(nodeid: number, nodeinfo) {
    const node = Node.find(nodeid);

    node.setNodeInfo(nodeinfo);
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

  setLevel(nodeid: number, level: number) {
    if (this.scanComplete) {
      this.zwave.setValue(nodeid, 38, 1, 0, level);
    } else {
      Logger.info("Not setting level: Initial scan not yet completed.");
    }
  }

  switchOn(nodeid: number) {
    if (this.scanComplete) {
      this.zwave.setValue(nodeid, 37, 1, 0, true);
    } else {
      Logger.info("Not switching on: Initial scan not yet completed.");
    }
  }

  switchOff(nodeid: number) {
    if (this.scanComplete) {
      this.zwave.setValue(nodeid, 37, 1, 0, false);
    } else {
      Logger.info("Not switching off: Initial scan not yet completed.");
    }
  }

  healNetwork() {
    this.zwave.healNetwork();
  }
}

export { MyZWave };
