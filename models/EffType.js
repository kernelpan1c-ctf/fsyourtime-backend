var mongoose = require('mongoose');

var effTypeSchema = mongoose.Schema(
    {
        name: {type: String, default: null},
        description: {type: String, default: null},
        relcategory: {type: mongoose.Schema.Types.ObjectId, ref: 'EffCategory'}
    },
    {
        collection: 'effTypes'
    }
);

exports.effTypeModel = mongoose.model('EffType', effTypeSchema);
//exports.effTypeModel = effTypeModel;
