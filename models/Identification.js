// ich habe nicht so wirklich Ahnung, wie das funktioniert, daher ist das jetzt alles aus dem Internet zusammengesucht

var mongoose = require('mongoose');

var identificationSchema = mongoose.Schema(
    {
		// Daten wie JSession und RelMatricularnr werden von der Efiport API geholt
        jsession: {type: String},
		logindate: {type: Date, expires: '4h', default: Date.now},
		// bei Login speichert das Dokument die JSessionID, das aktuelle Datum und die Matrikelnummer. Expires bedeutet, dass das Objekt 4 Stunden nach Erstellen geloescht wird		
        relmatricularnr: {type: Number}
    },
    {
        collection: 'identification'
    }
);

var identificationModel = mongoose.model('Identification', identificationSchema);
exports.identificationModel = identificationModel;