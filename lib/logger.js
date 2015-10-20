//TODO: Logging engine einbinden, konfigurieren und exportieren
//TODO: Logging in allen Routen einbinden
//Zugriffslog und Debug log sollten getrennt sein
//Jeder log eintrag sollte folgende Daten enthalten
//  -- Zugriffszeit
//  -- IP
//  -- Route
//  -- Parameter (Header/Body) [Passwörter löschen!!]
var winston = require('winston');
var logger;
logger = "";
