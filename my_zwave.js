var classy = require('classy');
var Node = require('./node').node;

var MyZWave = classy.define({
  zwave: null,
  nodes: null,
  eventListeners: null,

  init: function(zwave) {
    this.zwave = zwave;
    this.nodes = [];

    this.eventListeners = {};
  },

  registerEvents: function() {
    var self = this;

    var zwave = this.zwave;
    zwave.on('driver ready', function(homeid) {
        console.log('scanning homeid=0x%s...', homeid.toString(16));
    });

    zwave.on('driver failed', function() {
        console.log('failed to start driver');
        zwave.disconnect();
        process.exit();
    });

    zwave.on('node added', function(nodeid) {
        self.addNode(nodeid);
        console.log("Added node %d", nodeid);
    });

    zwave.on('value added', function(nodeid, comclass, value) {
        var node = Node.find(nodeid);
        node.addValue(comclass, value);
    });

    zwave.on('value changed', function(nodeid, comclass, value) {
        var node = Node.find(nodeid);

        if (node.isReady()) {
            console.log('node%d: changed: %d:%s:%s->%s', nodeid, comclass,
                    value['label'],
                    node.getValue(comclass, value.index)["value"],
                    value['value']);
        }

        node.setValue(comclass, value);
    });

    zwave.on('value removed', function(nodeid, comclass, index) {
        var node = Node.find(nodeid);

        node.removeValue(comclass, index);
    });

    zwave.on('node ready', function(nodeid, nodeinfo) {
      self.nodeReady(nodeid, nodeinfo);
    });

    zwave.on('notification', function(nodeid, notif) {
        switch (notif) {
        case 0:
            console.log('node%d: message complete', nodeid);
            break;
        case 1:
            console.log('node%d: timeout', nodeid);
            break;
        case 2:
            console.log('node%d: nop', nodeid);
            break;
        case 3:
            console.log('node%d: node awake', nodeid);
            break;
        case 4:
            console.log('node%d: node sleep', nodeid);
            break;
        case 5:
            console.log('node%d: node dead', nodeid);
            break;
        case 6:
            console.log('node%d: node alive', nodeid);
            break;
        }
    });

    zwave.on('event', function(nodeid, event) {
        console.log("node%d: event", nodeid);
        console.log(".. ", event);

        var node = Node.find(nodeid);

        _(self.eventListeners['event']).each(function(handler) {
          handler.call(this, node, event);
        });
    });
    zwave.on('scan complete', function() {
        console.log('scan complete, hit ^C to finish.');

        zwave.setLevel(2, 99);
        zwave.setLevel(5, 99);
        zwave.switchOn(7);
        zwave.setLevel(8, 99);

        zwave.setLevel(2, 0);
        zwave.setLevel(5, 0);
        zwave.switchOff(7);
        zwave.setLevel(8, 0);
    });
  },

  connect: function() {
    this.registerEvents();
    this.zwave.connect();
  },

  onEvent: function(handler) {
    if (!this.eventListeners['event']) {
      this.eventListeners['event'] = [];
    }

    this.eventListeners['event'].push(handler);
  },

  addNode: function(nodeid) {
    Node.add(nodeid);
    this.nodes[nodeid] = {
        manufacturer: '',
        manufacturerid: '',
        product: '',
        producttype: '',
        productid: '',
        type: '',
        name: '',
        loc: '',
        classes: {},
        ready: false,
    };
  },

  nodeReady: function(nodeid, nodeinfo) {
    var self = this;

    var node = Node.find(nodeid);

    node.setNodeInfo(nodeinfo);
    node.setReady();

    console.log(node.toString());

    if (node.isPollable()) {
      console.log(".. enabling poll");
      self.enablePoll(node);
    }
  },

  enablePoll: function(node) {
    _(node.pollableClasses()).each(function(commandClass) {
      this.zwave.enablePoll(node.nodeId, commandClass);
    });
  },

  setLevel: function(node, level) {
    this.zwave.setLevel(node.nodeId, level);
  }
});

exports.MyZWave = MyZWave;
