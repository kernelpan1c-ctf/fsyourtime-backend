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
        new (winston.transports.Console)
    ]
});

logger.add(winston.transports.Loggly, {
    token: "5f91ef69-840c-434d-b486-7ff317aef1fb",
    subdomain: "wipp",
    tags: ["Winston-NodeJS"],
    json:true
});

var id = 0;
var log = function (module, level, message) {
    var now = new Date();
    var formattedDate = dateformat(now, 'dd-mm-yyyy hh:MM:ss');
    logger.log(level, formattedDate + " - " + module + " - " + message);
    id += 1;
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
            fatal: function (message) {
                log(options.module, 'fatal', message);
            },
            error: function (message) {
                log(options.module, 'error', message);
            },
            info: function (message) {
                log(options.module, 'info', message);
            },
            warn: function (message) {
                log(options.module, 'warn', message);
            },
            debug: function (message) {
                log(options.module, 'debug', message);
            }
        };
    }
};
