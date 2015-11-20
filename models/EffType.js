var mongoose = require('mongoose');

var effTypeSchema = mongoose.Schema(
    {
        name: {type: String, default: null},
        description: {type: String, default: null},
        category: {type: String, default: null}
    },
    {
        collection: 'effTypes'
    }
);

exports.effTypeModel = mongoose.model('EffType', effTypeSchema);
//exports.effTypeModel = effTypeModel;
