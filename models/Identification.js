// ich habe nicht so wirklich Ahnung, wie das funktioniert, daher ist das jetzt alles aus dem Internet zusammengesucht
// TODO: Gegenchecken ob das so funktioniert
var mongoose = require('mongoose');

var identificationSchema = mongoose.Schema(
    {
        // Daten wie JSession und RelMatricularnr werden von der Efiport API geholt
        jsession: {type: String, required: true},
        createdAt: {type: Date, expires: '4h'},
        // bei Login speichert das Dokument die JSessionID, das aktuelle Datum und die Matrikelnummer.
        // Expires bedeutet, dass das Objekt 4 Stunden nach Erstellen geloescht wird
        studentid: {type: String, ref:'Student', required: true}
    },
    {
        collection: 'identification'
    }
);

identificationSchema.pre('save', function(next) {
    var now = new Date();
    this.createdAt = now;
    next();
});

exports.identificationModel = mongoose.model('Identification', identificationSchema);
//exports.identificationModel = identificationModel;