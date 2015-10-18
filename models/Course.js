var mongoose = require('mongoose');

var courseSchema = mongoose.Schema(
	{
		_id : {type: String, required: true, unique: true},
		name: {type: String, required: true},
		classOf: {type: Number, default: null} // Date oder number
	},
	{
	collection : 'Courses'
	}
);

exports.courseModel = mongoose.model('Course', courseSchema);

//exports.courseModel = courseModel;