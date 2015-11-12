var mongoose = require('mongoose');

var effortSchema = mongoose.Schema(
{ 	
	amount: {type: Number, default: 0, required: true},
	module: {type: String, ref: 'Module', required: true},
	createdBy: {type: String, ref: 'Student', required: true},
    type: {type: Number, ref: 'EffType'},
	bookingDate: {type: Date, default: Date.now},
	performanceDate: {type: Date},
	material: {type: String},
	place: {type: String}
},
{ 
	collection : 'efforts'
}
);

exports.effortModel = mongoose.model('Effort', effortSchema);
//exports.effortModel = effortModel;
