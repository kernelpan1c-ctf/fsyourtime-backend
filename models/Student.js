// grab the mongoose module
var mongoose = require('mongoose');

// define date schema (could also define directly in model declaration)
var studentSchema = mongoose.Schema(
    {
        // _id = matricularnr
        _id: {type: Number, required: true, unique: true},
        course: {type: String, ref: 'Course'},
        modules: [{type: String, ref: 'Module'}],
        efforts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Effort'}],
        privacyFlag: {type: Boolean, default: false, required: true}
    },
    {
        collection: 'students'
    }
);

var studentModel = mongoose.model('Student', studentSchema);
exports.studentModel = studentModel;

