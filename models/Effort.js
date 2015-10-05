var mongoose = require('mongoose');

var effortSchema = mongoose.Schema(
{ 	
	amount: {type: Number, default: null, required: true},
	module: { type: String, ref: 'Module', required: true },
	matricularnr: { type: String, ref: 'Student', required: true},
    category: {type: Number, ref: 'EffCategory.js'}
},
{ 
	collection : 'efforts'
}
);

var effortModel = mongoose.model('Effort', effortSchema);
exports.effortModel = effortModel;