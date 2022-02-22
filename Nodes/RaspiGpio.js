'use strict';

// nodeDefId must match the nodedef id in your nodedef
const nodeDefId = 'RASPI_GPIO';
const gpio = require('rpi-gpio');

module.exports = function(Polyglot) {
	// Utility function provided to facilitate logging.
	const logger = Polyglot.logger;

	// This is your custom Node class
	class RaspiGpio extends Polyglot.Node {

		// polyInterface: handle to the interface
		// address: Your node address, withouth the leading 'n999_'
		// primary: Same as address, if the node is a primary node
		// name: Your node name
		constructor(polyInterface, primary, address, name) {
			super(nodeDefId, polyInterface, primary, address, name);

			// PGC supports setting the node hint when creating a node
			// REF: https://github.com/UniversalDevicesInc/hints
			// Must be a string in this format
			// If you don't care about the hint, just comment the line.
			//this.hint = '0x01020900'; // Example for a Dimmer switch

			// Commands that this node can handle.
			// Should match the 'accepts' section of the nodedef.
			this.commands = {
				DON: this.onDON,
				DOF: this.onDOF,
				// You can use the query function from the base class directly
				QUERY: this.query,
			};

			// Status that this node has.
			// Should match the 'sts' section of the nodedef.
			// https://wiki.universal-devices.com/index.php?title=ISY_Developers:API:V5:Appendix:Units_of_Measure 
			this.drivers = {
				ST: {value: '0', uom: 2}
			};

			this.pin = parseInt(address.split('_')[1]);
			gpio.setup(this.pin, gpio.DIR_HIGH, err => {
				if(err) {
					logger.errorStack(err, 'Setup of GPIO failed:');
				} else {
					logger.info('GPIO setup complete: %s', this.address)
				}
			});


		}

		onDON(message) {
			logger.info('DON (%s): %s',
				this.address,
				message.value ? message.value : 'No value');

			gpio.write(this.pin, false, err => {
				if(err){
					logger.errorStack(err, 'GPIO write failed:');
				} else {
					logger.info('GPIO write ON complete: %s', this.address)
					this.setDriver('ST', message.value ? message.value : 1);
				}
			});
			
		}

		onDOF() {
			logger.info('DOF (%s)', this.address);


			gpio.write(this.pin, true, err => {
				if(err){
					logger.errorStack(err, 'GPIO write failed:');
				} else {
					logger.info('GPIO write OFF complete: %s', this.address)
					this.setDriver('ST', message.value ? message.value : 0);
				}
			});

		}
	
	};

	// Required so that the interface can find this Node class using the nodeDefId
	RaspiGpio.nodeDefId = nodeDefId;

	return RaspiGpio;

};

// Those are the standard properties of every nodes:
// this.id              - Nodedef ID
// this.polyInterface   - Polyglot interface
// this.primary         - Primary address
// this.address         - Node address
// this.name            - Node name
// this.timeAdded       - Time added (Date() object)
// this.enabled         - Node is enabled?
// this.added           - Node is addeto ISY?
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
