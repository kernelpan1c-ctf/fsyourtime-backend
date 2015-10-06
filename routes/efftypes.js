/**
 * Created by Kevin on 10/5/15.
 */

var effcatdb = require('../models/EffCategory.js');
var efftypedb = require('../models/EffType.js');
var db = require('../app.js');

exports.getTypeById = function (req, res) {
    // Get an EffortType by ID
    efftypedb.effTypeModel
        .find({_id: req.params.efftypeid})
        .populate({
            path: 'relcategory'
        }
    )
        .exec(function (err, efftype) {
            if (err) {
                console.log(err);
            }
            else {
                res.json(efftype);
            }
        });
};

exports.getTypeByName = function (req, res) {
    // Get an EffortType by its name
    efftypedb.effTypeModel
        .find({name: req.params.efftypename})
        .populate({
            path: 'relcategory'
        }
    )
        .exec(function (err, efftype) {
            if (err) {
                console.log(err);
            }
            else {
                res.json(efftype);
            }
        });
};

exports.getAllTypes = function (req, res) {
    // Get all EffTypes
    efftypedb.effTypeModel
        .find({})
        .populate({
            path: 'relcategory'
        }
    )
        .exec(function (err, efftypes) {
            if (err) {
                console.log(err);
            }
            else {
                res.json(efftypes);
            }
        });
};

