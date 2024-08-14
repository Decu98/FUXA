/**
 * template to define owner device driver communication  
 */

'use strict';

var mysql

function MySQLClient(_data, _logger, _events) {

    var data = JSON.parse(JSON.stringify(_data)); // Current Device data { id, name, tags, enabled, ... }
    var logger = _logger;
    var events = _events; // Events to commit change to runtime
    this.pool = null;
    this.connection = null;


    /**
     * initialize the device type 
     */
    this.init = function (_type) {
        console.error('Not supported!');
    }

    /**
     * Connect to device
     * Emit connection status to clients, clear all Tags values
     */
    this.connect = function () {
        // console.error('Not supported!');
        return new Promise(async (resolve, reject) => {
            if (!data.enabled) {
                events.emit('device-status:changed', { id: data.id, status: 'connect-off' });
                reject()
            } else if (data.property && data.property.address) {
                try {
                    if (_checkWorking(true)) {
                        logger.info(`'${data.name}' try to connect ${data.property.address}`, true);
                        var security
                        await getProperty({query: 'security', name: data.id}).then((result, error) => {
                            if (result) {
                                security = utils.JsonTryToParse(result.value);
                            }
                        });
                        var connectionsString = 'mysql://'
                        if (security.uid) {
                            connectionsString += security.uid;
                        }
                        if (security.pwd) {
                            connectionsString += `:${security.pwd}`;
                        }
                        //  IP:PORT/DATABASE
                        connectionsString += data.property.address;

                        this.pool = await mysql.createPool(connectionsString)
                        this.connection = await mysql.getConnection();
                        logger.info(`'${data.name}' connected!`);
                        events.emit('device-status:changed', { id: data.id, status: 'connect-ok' });
                        _checkWorking(false);
                        resolve();
                        return;
                    }
                } catch(err){
                    if (data.enabled) {
                        logger.error(`'${data.name}' try to connect error! ${err}`);
                        events.emit('device-status:changed', { id: data.id, status: 'connect-error' });
                    }
                }
                if (this.connection) {
                    try {
                        this.connection.release();
                    } catch { }
                }
                reject();
            } else {
                logger.error(`'${data.name}' missing connection data!`);
                events.emit('device-status:changed', { id: data.id, status: 'connect-failed' });
                reject();
            }
            _checkWorking(false);
        })
        // events.emit('device-status:changed', { id: data.id, status: 'connect-ok' });
        // events.emit('device-status:changed', { id: data.id, status: 'connect-error' });
    }


    /**
     * Disconnect the device
     * Emit connection status to clients, clear all Tags values
     */
    this.disconnect = function () {
        return new Promise(async (resolve, reject) => {
            if (this.connection) {
                try {
                    await this.connection.release();
                    await this.pool.release();
                } catch { }
            }
            _checkWorking(false);
            events.emit('device-status:changed', { id: data.id, status: 'connect-off' });
            resolve(true);
        })
        // events.emit('device-status:changed', { id: data.id, status: 'connect-off' });
    }

    /**
     * Read values in polling mode 
     * Update the tags values list, save in DAQ if value changed or in interval and emit values to clients
     */
    this.polling = async function () {
        console.error('Not supported!');
        // events.emit('device-value:changed', { id: data.name, values: values });
    }

    /**
     * Load Tags attribute to read with polling
     */
    this.load = function (_data) {
        console.error('Not supported!');
    }

    /**
     * Return Tags values array { id: <name>, value: <value> }
     */
    this.getValues = function () {
        console.error('Not supported!');
    }

    /**
     * Return Tag value { id: <name>, value: <value>, ts: <lastTimestampValue> }
     */
    this.getValue = function (tagid) {
        console.error('Not supported!');
    }

    /**
     * Return connection status 'connect-off', 'connect-ok', 'connect-error', 'connect-busy'
     */
    this.getStatus = function () {
        console.error('Not supported!');
    }

    /**
     * Return Tag property to show in frontend
     */
    this.getTagProperty = function (tagid) {
        console.error('Not supported!');
    }

    /**
     * Set the Tag value to device
     */
    this.setValue = function (tagid, value) {
        console.error('Not supported!');
    }

    /**
     * Return if device is connected
     */
    this.isConnected = function () {
        console.error('Not supported!');
    }

    /**
     * Bind the DAQ store function and default daqInterval value in milliseconds
     */
    this.bindAddDaq = function (fnc) {
        this.addDaq = fnc;                         // Add the DAQ value to db history
    }

    /**
     * Return the timestamp of last read tag operation on polling
     * @returns 
     */
    this.lastReadTimestamp = () => {
        console.error('Not supported!');
    }

    /**
     * Return the Daq settings of Tag
     * @returns 
     */
    this.getTagDaqSettings = (tagId) => {
        console.error('Not supported!');
    }

    /**
     * Set Daq settings of Tag
     * @returns 
     */
    this.setTagDaqSettings = (tagId, settings) => {
        console.error('Not supported!');
    }

    /**
 * Used to manage the async connection and polling automation (that not overloading)
 * @param {*} check 
 */
    var _checkWorking = function (check) {
        if (check && working) {
            overloading++;
            logger.warn(`'${data.name}' working (connection || polling) overload! ${overloading}`);
            // !The driver don't give the break connection
            if (overloading >= 3) {
                try {
                    this.disconnect();
                } catch (e) {
                    console.error(e);
                }
            } else {
                return false;
            }
        }
        working = check;
        overloading = 0;
        return true;
    }
}

module.exports = {
    init: function (settings) {
    },
    create: function (data, logger, events, manager) {
        
        // To use with plugin
        // try { TemplateDriver = require('template-driver'); } catch { }
        if (!MySQLClient && manager) { try { MySQLClient = manager.require('mysql2'); } catch { } }
        // if (!TemplateDriver) return null;

        return new MySQLClient(data, logger, events);
    }
}
