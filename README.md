# homebridge-solaredge-inverter
A [SolarEdge](https://www.solaredge.com) Inverter plugin for
[Homebridge](https://github.com/nfarina/homebridge).  This creates a a set of Light Sensors in homekit,
 where the LUX reading is actually the  power generation in KiloWatts.  There is also an option to display battery level if applicable.

This code is heavily based on the work of Stog's [homebridge-fronius-inverter](https://github.com/Stog/homebridge-fronius-inverter) accessory.

# Installation
Run these commands:

    % sudo npm install -g homebridge
    % sudo npm install -g homebridge-solaredge-inverter


NB: If you install homebridge like this:

    sudo npm install -g --unsafe-perm homebridge

Then all subsequent installations must be like this:

    sudo npm install -g --unsafe-perm homebridge-solaredge-inverter

# Configuration

Example accessory config (needs to be added to the homebridge config.json):
 ...

		"accessories": [
      {
				"name": "SolarEdge Inverter",
				"manufacturer": "SolarEdge",
				"model": "SE10000H-US000BNU4",
				"serial": "myserialno",
				"site_id": "mysiteid",
				"api_key": "longapikey",
				"update_interval": 15,
				"accessory": "SolarEdge Inverter",
				"display": {
										"current": true,
										"last_day": false,
										"last_month": false,
										"last_year": false,
										"life_time": true
										"battery": true
				},
				"debug": false
				}
			}
    ]
 ...

### Config Explanation:

Field           						| Description
----------------------------|------------
**accessory**   						| (required) Must always be "SolarEdge Inverter".
**name**										| (required) The name you want to use for for the power level widget.
**site_id**  								| (required) The Site ID for your SolarEdge installation.
**api_key**		  						| (required) The API Key for the administration of your SolarEdge site.
**manufacturer**						| (optional) This shows up in the homekit accessory Characteristics.
**model**										| (optional) This shows up in the homekit accessory Characteristics.
**serial**									| (optional) This shows up in the homekit accessory Characteristics.
**update_interval**					| (optional) The frequency to poll the SolarEdge API in minutes (defaults to 15).
**debug**										| (optional) Enables additional logging.
**display -> current**		| (required) Display current power (kW).
**display -> last_day**		| (required) Display Last Day power (kW).
**display -> last_month**	| (required) Display Last Month power (kW).
**display -> last_year**	| (required) Display Last Year power (kW).
**display -> life_time**	| (required) Display Life Time power (kW).
**display -> battery**		| (required) Display Battery Level (%).

