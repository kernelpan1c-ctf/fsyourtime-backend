var effortdb = require('../models/Effort.js');
var studdb = require('../models/Student.js');
var moduledb = require('../models/Module.js');
var efforttypedb = require('../models/EffType.js');
var async = require('async');


exports.compareByModule = function(req, res) {
    //console.log(req.body);
    var modId = req.params.moduleid;
	var studentId = req.headers['x-key'];
    if(!modId) {
        return res.status(400).send("Module parameter was undefined");
    }

    async.parallel({
        module: function(callback) {
            //console.log(modId);
            moduledb.moduleModel.findById(modId, function(err, result) {
                if (err) {
					console.log(err);
                    return callback(err);
                }
                if (!result) {
                    return callback("Module not found");
                } else {
                    return callback(null, result);
                }
            });
        },
        topthree: function(callback) {
			//console.log("best");
            effortdb.effortModel.aggregate([
			    { $match: {
				    module: modId
			    }},
			    { $group: {
				    _id : "$createdBy",
				    sum: {$sum : "$amount"}
			    }},
		        { $sort: { sum: -1}},
		        { $limit : 3}			
		    ], function(err, result) {
                if (err) {
					console.log(err);
                    return callback(err);
                }
				else if (result.length == 3){
					//console.log(result);
					return callback(null, result);
				}
				else {
                    return callback(null, "Not enough participants");
                }
            });
        },
		bottomthree: function(callback) {
			//console.log("worst");
            effortdb.effortModel.aggregate([
			    { $match: {
				    module: modId
			    }},
			    { $group: {
				    _id : "$createdBy",
				    sum: {$sum : "$amount"}
			    }},
		        { $sort: { sum: 1}},
		        { $limit : 3}			
		    ], function(err, result) {
                if (err) {
					console.log(err);
                    return callback(err);
                }
				else if (result.length == 3){
					//console.log(result);
					return callback(null, result);
				}
				else {
                    return callback(null, "Not enough participants");
                }
            });
        },
		me: function(callback) {
			//console.log("me");
            effortdb.effortModel.aggregate([
			    { $match: {
				    module: modId,
					createdBy: studentId
			    }},
			    { $group: {
					_id: null,
				    sum: {$sum : "$amount"}
			    }},			
		    ], function(err, result) {
				//console.log(result);
                if (err) {
					console.log(err);
                    return callback(err);
                }
                else {
                    return callback(null, result); 
                }
            });
        },
		average: function(callback) {
			//console.log("average");
            effortdb.effortModel.aggregate([
			    { $match: {
				    module: modId
			    }},
			    { $group: {
					_id : null,
				    average: {$avg : "$amount"}
			    }},			
		    ], function(err, result) {
				//console.log(result);
                if (err) {
					console.log(err);
                    return callback(err);
                }
                else {
                    return callback(null, result);      
                }
            });
        }
    }, function(err, results) {
		if(err) {
            console.log('We have an error: ' + err);
            res.status(500).send('I fucked this up :(');
        }
        else {
			res.status(200).send(results);
        }
    });
};
