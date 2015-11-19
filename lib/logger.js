//TODO: Logging engine einbinden, konfigurieren und exportieren
//TODO: Logging in allen Routen einbinden
//Zugriffslog und Debug log sollten getrennt sein
//Jeder log eintrag sollte folgende Daten enthalten
//  -- Zugriffszeit
//  -- IP
//  -- Route
//  -- Parameter (Header/Body) [Passwörter löschen!!]
var winston = require('winston');
require('winston-loggly');
var dateformat = require('dateformat');

var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console({timestamp:true, level:'debug'})
    ]
});

/*
logger.add(winston.transports.Loggly, {
    token: "5f91ef69-840c-434d-b486-7ff317aef1fb",
    subdomain: "wipp",
    tags: ["wi1221", "praxisprojekt"],
    json:true,
    timestamp: true,
    level:'debug'
});

*/

logger.add(winston.transports.File, {filename: 'logs/requests.log', level: 'debug', timestamp:true});

var log = function (module, level, message, metadata) {
    //var now = new Date();
    //var formattedDate = dateformat(now, 'dd-mm-yyyy hh:MM:ss');
    logger.log(level, '[' + module + '] ' + message, metadata);
};

module.exports = {
    add: function (transport, options) {
        logger.add(transport, options);
    },

    remove: function (transport) {
        logger.remove(transport);
    },

    getLogger: function (options) {
        return {
            fatal: function (message, metadata) {
                log(options.module, 'fatal', message, metadata);
            },
            error: function (message, metadata) {
                log(options.module, 'error', message, metadata);
            },
            info: function (message, metadata) {
                log(options.module, 'info', message, metadata);
            },
            warn: function (message, metadata) {
                log(options.module, 'warn', message, metadata);
            },
            debug: function (message, metadata) {
                log(options.module, 'debug', message, metadata);
            }
        };
    }

};
