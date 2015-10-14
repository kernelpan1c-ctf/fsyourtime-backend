var mongoose = require('mongoose');

var effortSchema = mongoose.Schema(
{ 	
	amount: {type: Number, default: null, required: true},
	module: { type: String, ref: 'Module', required: true },
	studentid: { type: String, ref: 'Student', required: true},
	date: {tyoe: Date, required: true, default: Date.now()},
    category: {type: String}
},
{ 
	collection : 'efforts'
}
);

var effortModel = mongoose.model('Effort', effortSchema);
exports.effortModel = effortModel;