const axios = require('axios');
const setupCache = require('axios-cache-adapter').setupCache;

var Service, Characteristic;

const DEF_MIN_LUX = 0,
      DEF_MAX_LUX = 65535,
	  DEF_MIN_BATTERY = 0,
	  DEF_MAX_BATTERY = 100;

const DISPLAY_USAGE_SENSORS = 0;

const PLUGIN_NAME   = 'homebridge-solaredge-separate-battery';
const ACCESSORY_NAME = 'SolarEdge Battery';

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory(PLUGIN_NAME, ACCESSORY_NAME, SolarEdgeBattery);
}
	

/**
 * Setup Cache For Axios to prevent additional requests
 */
const cache = setupCache({
	maxAge: 1 * 60 * 1000, //in ms
	readHeaders: false,
	// For this example to work we disable query exclusion
	exclude: { query: false }
})

const api = axios.create({
	adapter: cache.adapter
})

function isEmptyObject(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

/**
 * Main API request with site overview data
 *
 * @param {siteID} the SolarEdge Site ID to be queried
 * @param {apiKey} the SolarEdge monitoring API Key for access to the Site
 */
const getInverterData = async(siteID, apiKey, update_interval) => {
	try {
	    return await api.get('https://monitoringapi.solaredge.com/site/'+siteID+'/overview?api_key='+apiKey, {
	    	cache: {
	    	maxAge: update_interval
	    	}
	    })
	} catch (error) {
	    console.error(error)
	}
}

/**
 * Gets and returns the accessory's value in the correct format.
 *
 * @param {siteID} the SolarEdge Site ID to be queried
 * @param {apiKey} the SolarEdge monitoring API Key for access to the Site
 * @param (log) access to the homebridge logfile
 * @return {bool} the value for the accessory
 */
/*const getAccessoryValue = async(that) => {
	if (that.debug) {
		that.log.info('Calling API');
	}
	// To Do: Need to handle if no connection
	const inverterData = await getInverterData(that.siteID, that.apiKey, that.update_interval)

	if(inverterData) {
		if (that.debug) {
			if (inverterData.request.fromCache !== true) {
				that.log.info('Data from API', inverterData.data.overview);
			} else {
				that.log.info('Data from cache', inverterData.data.overview);
			}
		}
		if(inverterData.data.overview) {
			return inverterData.data.overview;
		}
		else {
			return null
		}
	} else {
		return null
	}
}*/

/**
 * API request with power flow data
 *
 * @param {siteID} the SolarEdge Site ID to be queried
 * @param {apiKey} the SolarEdge monitoring API Key for access to the Site
 */
const getPowerFlowData = async(siteID, apiKey, update_interval) => {
	try {
	    return await api.get('https://monitoringapi.solaredge.com/site/'+siteID+'/currentPowerFlow?api_key='+apiKey, {
	    	cache: {
	    	maxAge: update_interval
	    	}
	    })
	} catch (error) {
	    console.error(error)
	}
}

/**
 * Gets and returns the battery's charge value in the correct format.
 */
const getBatteryValues = async (that) => {
	if (that.debug) {
		that.log.info('Calling Flow API');
	}
	// To Do: Need to handle if no connection
	const powerFlowData = await getPowerFlowData(that.siteID, that.apiKey, that.update_interval)

	if(powerFlowData) {
		if (that.debug) {
			if (powerFlowData.request.fromCache !== true) {
				that.log.info('Data from Power Flow API', powerFlowData.data.siteCurrentPowerFlow);
			} else {
			that.log.info('Data from Power Flow cache', powerFlowData.data.siteCurrentPowerFlow);
			}
		}
		if(powerFlowData.data.siteCurrentPowerFlow) {
			return powerFlowData.data.siteCurrentPowerFlow;
		}
		else {
			return null
		}
	} else {
		return null
	}
}

const update = async(that) => {
	if(true){
		const batteryValues = await getBatteryValues(that);
		let chargeLevel = 0;
		let chargingState = 2;
		let lowBattery = false;
		if (!isEmptyObject(batteryValues)) {
			chargeLevel = batteryValues.STORAGE.chargeLevel;
			lowBattery = batteryValues.STORAGE.critical;
			if (batteryValues.STORAGE.status == "Idle") {
				chargingState = 0;
			}
			else {
				batteryValues.connections.forEach(element => {
					if (element.to == "STORAGE"){
	//    		inProgress
						chargingState = 1;
					}
					else {
						chargingState = 0;
					}
				})
			}
		}
		/*that.battery
			.getCharacteristic(Characteristic.BatteryLevel)
				.updateValue(chargeLevel);
		that.battery
			.getCharacteristic(Characteristic.ChargingState)
				.updateValue(chargingState);
		that.battery
			.getCharacteristic(Characteristic.StatusLowBattery)
				.updateValue(lowBattery);*/
		that.battery.getCharacteristic(Characteristic.BatteryLevel)
				.updateValue(chargeLevel);
	}
}

// making a separate class for the battery, so i can use it for automations
class SolarEdgeBattery {
	constructor(log, config) {
		this.log = log
		this.config = config
		this.current = this.config.current;

		if(this.current) {
			this.battery = new Service.LightSensor("Battery Level", "Battery Level")
		}
		this.name = "House Battery";
		this.manufacturer = this.config.manufacturer || "SolarEdge";
		this.model = this.config.model || "Inverter";
		this.serial = this.config.serial || "solaredge-inverter-battery-1";
		this.siteID = this.config.site_id;
		this.apiKey = this.config.api_key;
		this.update_interval = (this.config.update_interval || 15) * 60 * 1000;
		this.debug = this.config.debug || false;
		this.minLux = this.config.min_lux || DEF_MIN_LUX;
		this.maxLux = this.config.max_lux || DEF_MAX_LUX;

		if(true) {
			update(this);
			setInterval ( async() => {
				if(true){
					const batteryValues = await getBatteryValues(this);
					let chargeLevel = 0;
					let chargingState = 2;
					let lowBattery = false;
					if (!isEmptyObject(batteryValues)) {
						chargeLevel = batteryValues.STORAGE.chargeLevel;
						lowBattery = batteryValues.STORAGE.critical;
						if (batteryValues.STORAGE.status == "Idle") {
							chargingState = 0;
						}
						else {
							batteryValues.connections.forEach(element => {
								if (element.to == "STORAGE"){
				//    		inProgress
									chargingState = 1;
								}
								else {
									chargingState = 0;
								}
							})
						}
					}
					/*this.battery
						.getCharacteristic(Characteristic.BatteryLevel)
							.updateValue(chargeLevel)
						.getCharacteristic(Characteristic.ChargingState)
							.updateValue(chargingState)
						.getCharacteristic(Characteristic.StatusLowBattery)
							.updateValue(lowBattery)*/

					this.battery.getCharacteristic(Characteristic.BatteryLevel)
						.updateValue(chargeLevel != 0 ? chargeLevel : 0.001);
					
				}
			}, this.update_interval)
		}
	}

	getServices () {
		const informationService = new Service.AccessoryInformation()
			.setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
			.setCharacteristic(Characteristic.Model, this.model)
			.setCharacteristic(Characteristic.SerialNumber, this.serial)

		const services = [informationService]

		/*if(this.current) {
			this.currentPower.getCharacteristic(Characteristic.BatteryLevel)
			services.push(this.currentPower);
		}

		if(this.lastDayPower) {
			this.lastDayPower.getCharacteristic(Characteristic.BatteryLevel)
			services.push(this.lastDayPower);
		}

		if(this.lastMonth) {
			this.lastMonth.getCharacteristic(Characteristic.BatteryLevel)
			services.push(this.lastMonth);
		}

		if(this.lastYear) {
			this.lastYear.getCharacteristic(Characteristic.BatteryLevel)
			services.push(this.lastYear);
		}

		if(this.lifeTime) {
			this.lifeTime.getCharacteristic(Characteristic.BatteryLevel)
			services.push(this.lifeTime);
		}*/

		/*if(this.battery) {
			this.battery.getCharacteristic(Characteristic.BatteryLevel)
			this.battery.getCharacteristic(Characteristic.ChargingState)
			this.battery.getCharacteristic(Characteristic.StatusLowBattery)
						services.push(this.battery);
		}*/

		if(true) {
			this.battery.getCharacteristic(Characteristic.BatteryLevel)
						services.push(this.battery);
		}

		return services
	}
}