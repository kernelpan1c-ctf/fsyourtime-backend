var mongoose = require('mongoose');

var effCategorySchema = mongoose.Schema(
    {
        _id : {type: Number, required: true, unique:true},
        name: {type: String, default: null},
        description: {type: String, default: null}
    },
    {
        collection: 'effCategories'
    }
);

var effCategoryModel = mongoose.model('EffCategory', effCategorySchema);
exports.effCategoryModel = effCategoryModel;