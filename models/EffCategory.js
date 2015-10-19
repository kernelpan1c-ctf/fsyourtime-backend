var mongoose = require('mongoose');

var effCategorySchema = mongoose.Schema(
    {
        name: {type: String, default: null},
        description: {type: String, default: null}
    },
    {
        collection: 'effCategories'
    }
);

exports.effCategoryModel = mongoose.model('EffCategory', effCategorySchema);
//exports.effCategoryModel = effCategoryModel;
