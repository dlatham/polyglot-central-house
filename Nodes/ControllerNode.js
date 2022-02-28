'use strict';

// The controller node is a regular ISY node. It must be the first node created
// by the node server. It has an ST status showing the nodeserver status, and
// optionally node statuses. It usually has a few commands on the node to
// facilitate interaction with the nodeserver from the admin console or
// ISY programs.

// nodeDefId must match the nodedef id in your nodedef
const nodeDefId = 'CONTROLLER';

// # Define the GPIOs for lights
// #CH PIN WIRPI BCM NAME
// #CH1 29 P21 5 Channel 1
// #CH2 31 P22 6 Channel 2
// #CH3 33 P23 13 Channel 3
// #CH4 36 P27 16 Channel 4
// #CH5 35 P24 19 Channel 5
// #CH6 38 P28 20 Channel 6
// #CH7 40 P29 21 Channel 7
// #CH8 37 P25 26 Channel 8
// audio = 29
// path = 37
// accent = 33
// landscape2 = 33
// shed = 36 # CHANNEL 4
// bench = 35
// landscape = 40

// Here I am defining all of thhe GPIO pins on the raspberry pi
// as this will be iterated through to create nodes.

// This script will be running on the same raspberry pi so no
// discovery will be necessary.

const raspi_relays = [
  {name: 'Yard Audio', pin: 29},
  {name: 'Path Lights', pin: 37},
  {name: 'Shed Lights', pin: 36},
  {name: 'Bench Lights', pin: 35},
  {name: 'Landscape Lights', pin: 40}
]

module.exports = function(Polyglot) {
  // Utility function provided to facilitate logging.
  const logger = Polyglot.logger;

  // In this example, we also need to have our custom node because we create
  // nodes from this controller. See onCreateNew
  //const MyNode = require('./MyNode.js')(Polyglot);
  const RaspiGpio = require('./RaspiGpio.js')(Polyglot);

  class Controller extends Polyglot.Node {
    // polyInterface: handle to the interface
    // address: Your node address, withouth the leading 'n999_'
    // primary: Same as address, if the node is a primary node
    // name: Your node name
    constructor(polyInterface, primary, address, name) {
      super(nodeDefId, polyInterface, primary, address, name);

      // Commands that this controller node can handle.
      // Should match the 'accepts' section of the nodedef.
      this.commands = {
        CREATE_NEW: this.onCreateNew,
        DISCOVER: this.onDiscover,
        UPDATE_PROFILE: this.onUpdateProfile,
        REMOVE_NOTICES: this.onRemoveNotices,
        QUERY: this.query,
      };

      // Status that this controller node has.
      // Should match the 'sts' section of the nodedef.
      this.drivers = {
        ST: { value: '1', uom: 2 }, // uom 2 = Boolean. '1' is True.
      };

      this.isController = true;
    }

    // Creates a new node using MyNode class, using a sequence number.
    // It needs to be an async function because we use the
    // this.polyInterface.addNode async function
    async onCreateNew() {
      const prefix = 'centralhouse';
      const nodes = this.polyInterface.getNodes();

      // Loop through each of the GPIO definitions above and
      // add the node if it hasn't been added already...
      for (let seq = 0; seq < raspi_relays.length; seq++) {
        let address = 'gpio_' + raspi_relays[seq].pin.toString();
        if (!nodes[address]) {
          try {
            let result = await this.polyInterface.addNode(
              new RaspiGpio(this.polyInterface, this.address, address, raspi_relays[seq].name)
            );
            logger.info('Add node worked: %s', result);
          } catch(err){
            logger.errorStack(err, 'Add node failed:');
          }
        }
      }
    }

    // Here you could discover devices from a 3rd party API
    onDiscover() {
      logger.info('Discovering');
    }

    // Sends the profile files to ISY
    onUpdateProfile() {
      this.polyInterface.updateProfile();
    }

    // Removes notices from the Polyglot UI
    onRemoveNotices() {
      this.polyInterface.removeNoticesAll();
    }
  };

  // Required so that the interface can find this Node class using the nodeDefId
  Controller.nodeDefId = nodeDefId;

  return Controller;
};


// Those are the standard properties of every nodes:
// this.id              - Nodedef ID
// this.polyInterface   - Polyglot interface
// this.primary         - Primary address
// this.address         - Node address
// this.name            - Node name
// this.timeAdded       - Time added (Date() object)
// this.enabled         - Node is enabled?
// this.added           - Node is added to ISY?
// this.commands        - List of allowed commands
//                        (You need to define them in your custom node)
// this.drivers         - List of drivers
//                        (You need to define them in your custom node)

// Those are the standard methods of every nodes:
// Get the driver object:
// this.getDriver(driver)

// Set a driver to a value (example set ST to 100)
// this.setDriver(driver, value, report=true, forceReport=false, uom=null)

// Send existing driver value to ISY
// this.reportDriver(driver, forceReport)

// Send existing driver values to ISY
// this.reportDrivers()

// When we get a query request for this node.
// Can be overridden to actually fetch values from an external API
// this.query()

// When we get a status request for this node.
// this.status()
