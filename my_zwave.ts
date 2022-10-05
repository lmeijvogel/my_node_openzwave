import { each } from "lodash";
import OpenZWave = require("openzwave-shared");
import { Node } from "./node";
import { Logger } from "./logger";

const DEVICE_PATH = "/dev/ttyUSB0";

class MyZWave {
    private readonly nodes: Object[];

    private readonly eventListeners: Object;

    private scanComplete: boolean;

    constructor(private readonly zwave: OpenZWave) {
        this.nodes = [];

        this.eventListeners = {};

        this.scanComplete = false;
    }

    registerEvents() {
        this.zwave.on("driver ready", homeid => {
            Logger.verbose("Scanning homeid=0x%s...", homeid.toString());
        });

        this.zwave.on("driver failed", () => {
            Logger.error("Failed to start driver");
            this.zwave.disconnect(DEVICE_PATH);
            process.exit();
        });

        this.zwave.on("node added", nodeid => {
            this.addNode(nodeid);
            Logger.verbose("Added node %d", nodeid);
        });

        this.zwave.on("value added", (nodeid, comclass, value) => {
            const node = Node.find(nodeid);

            node.addValue(comclass, value);
        });

        this.zwave.on("value changed", (nodeid: number, comclass, value) => {
            const node = Node.find(nodeid);

            node.setValue(comclass, value);

            each(this.eventListeners["valueChange"], handler => {
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
                    Logger.info("node%d: message complete", nodeid);
                    break;
                case 1:
                    Logger.warn("node%d: timeout", nodeid);
                    break;
                case 2:
                    Logger.info("node%d: nop", nodeid);
                    break;
                case 3:
                    Logger.info("node%d: node awake", nodeid);
                    break;
                case 4:
                    Logger.info("node%d: node sleep", nodeid);
                    break;
                case 5:
                    Logger.warn("node%d: node dead", nodeid);
                    break;
                case 6:
                    Logger.info("node%d: node alive", nodeid);
                    break;
                default:
                    Logger.info("node%d: unexpected message (nothing serious)", nodeid);
                    break;
            }
        });

        this.zwave.on("node event", (nodeid: number, event) => {
            Logger.verbose("node%d: event: %s", nodeid, event);

            const node = Node.find(nodeid);

            each(this.eventListeners["node event"], handler => {
                handler.call(null, node, event);
            });
        });

        this.zwave.on("neighbors", (nodeid: number, neighbors) => {
            const formattedNeighbors = neighbors.join(", ");

            Logger.info("node%d: neighbors: [ %s ]", nodeid, formattedNeighbors);
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

    onNodeEvent(handler) {
        if (!this.eventListeners["node event"]) {
            this.eventListeners["node event"] = [];
        }
        this.eventListeners["node event"].push(handler);
    }

    onValueChange(handler) {
        if (!this.eventListeners["valueChange"]) {
            this.eventListeners["valueChange"] = [];
        }
        this.eventListeners["valueChange"].push(handler);
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
            ready: false,
        };
    }

    nodeReady(nodeid: number, nodeinfo) {
        const node = Node.find(nodeid);

        node.setNodeInfo(nodeinfo);
        node.setReady();
        Logger.debug("Node ready, node: %s", node);
        if (node.isPollable()) {
            Logger.debug(".. enabling poll");
            this.enablePoll(node);
        }
    }

    enablePoll(node: Node) {
        Logger.info("Not enabling polling: I don't know what instance/index should be polled.");

        each(node.pollableClasses(), commandClass => {
            const valueId = {
                nodeid: node.nodeId,
                class_id: commandClass,
                instance: 1,
                index: 0,
            };

            this.zwave.enablePoll(valueId, 2);
        });
    }

    setLevel(nodeid: number, level: number) {
        if (this.scanComplete) {
            this.zwave.setNodeLevel(nodeid, level);
        } else {
            Logger.info("Not setting level: Initial scan not yet completed.");
        }
    }

    switchOn(nodeid: number) {
        if (this.scanComplete) {
            this.zwave.setNodeOn(nodeid);
        } else {
            Logger.info("Not switching on: Initial scan not yet completed.");
        }
    }

    switchOff(nodeid: number) {
        if (this.scanComplete) {
            this.zwave.setNodeOff(nodeid);
        } else {
            Logger.info("Not switching off: Initial scan not yet completed.");
        }
    }

    healNetwork() {
        this.zwave.healNetwork();
    }
}

export { MyZWave };
