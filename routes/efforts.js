/**
 * Created by Kevin on 10/5/15.
 */

var effortdb = require('../models/Effort.js');
var studdb = require('../models/Student.js');
var identdb = require('../models/Identification.js');
var moduledb = require('../models/Module.js');
var efforttypedb = require('../models/EffType.js');
var async = require('async');

exports.getEffortsByStudent = function (req, res) {
    // Student can view a list of his efforts
    // Result contains all information about the efforts, however, not all must be used
    var studentId = req.headers['x-key'];
    async.series([
        function(callback) {
            console.log("Checking for student: " + studentId);
            studdb.studentModel.count({ _id: studentId }, function(err, count) {
                //console.log("Found: " + count);
                if(count > 0) {
                    console.log("Student found. Searching database for efforts.");
                    callback()
                } else {
                    callback("Student not in Database!");
                }
            });
        },
        function(callback) {
            effortdb.effortModel.find( { createdBy: studentId }, function(err, result) {
                if(err) console.log(err);
                else callback(null, result);
            });
        }
    ], function (err, result) {
        console.log("Done. Sending results.");
        if(err) res.status(500).send(err);
        else if(result) res.status(200).send(result[1]);
    });
};

exports.getEffortById = function (req, res) {
    // Get an Effort by ID
    var effortid = req.params.effortid;
    effortdb.effortModel.findById(effortid, function (err, effort) {
        if (err) {
            console.log(err);
        } else {
            res.status(200).send(effort);
        }
    });
};

exports.getEffortsByModule = function (req, res) {
    // Student can view a list of his efforts for one selected module
    // Result contains all information about the efforts, however, not all must be used
	var moduleId = req.params.moduleid;
	var studentId = req.headers['x-key'];
    async.series([
        function(callback) {
            console.log("Checking for student: " + studentId);
            studdb.studentModel.count({ _id: studentId }, function(err, count) {
                //console.log("Found: " + count);
                if(count > 0) {
                    console.log("Student found. Searching database for module.");
                    callback()
                } else {
                    callback("Student not in Database!");
                }
            });
        },
		function(callback) {
            console.log("Checking for module: " + moduleId);
            moduledb.moduleModel.count({ _id: moduleId }, function(err, count) {
                //console.log("Found: " + count);
                if(count > 0) {
                    console.log("Module found. Searching database for efforts.");
                    callback()
                } else {
                    callback("Module not in Database!");
                }
            });
        },
        function(callback) {
            effortdb.effortModel.find( { createdBy: studentId, module: moduleId }, function(err, result) {
                if(err) console.log(err);
                else callback(null, result);
            });
        }
    ], function (err, result) {
        console.log("Done. Sending results.");
        if(err) res.status(500).send(err);
        else if(result) res.status(200).send(result[2]);
    });
};
  
  

exports.createEffort = function(req, res) {
    //console.log(req.body);
    var modId = req.body.moduleid;
    var studId = req.headers['x-key'];
	var efftypeId = req.body.efforttypeid;
    var amount = req.body.amount;
    var performanceDate = req.body.performancedate || Date.now();

    if(!modId || !studId || !efftypeId) {
        return res.status(400).send("One of the parameters was undefined");
    }

    if(!amount || amount < 1) {
        return res.status(400).send("Amount has to be greater or equal to 1");
    }
    /*
    if(!performanceDate) {
        return res.status(400).send("Performance Date has to be set");
    }
    */
    async.parallel([
        function(callback) {

            console.log(modId + " " + studId + " " + efftypeId);
            moduledb.moduleModel.findById(modId, function(err, result) {
                if (err) {
                    return callback(err);
                }
                if (!result) {
                    return callback("Module not found");
                } else {
                    return callback(null, result);
                }
            });
        },
        function(callback) {
            studdb.studentModel.findById(studId, function(err, result) {
                if (err) {
                    return callback(err);
                }
                if (!result) {
                    return callback("Student not found");

                } else {
                    return callback(null, result);
                }
            });

        },
		function(callback) {
            efforttypedb.effTypeModel.findById(efftypeId, function(err, result) {
                if (err) {
                    return callback(err);
                }
                if (!result) {
                    return callback("Effort Type not found");
                } else {
                    return callback(null, result);
                }
            });

        }
    ], function(err, results) {
        if(err) {
            console.log('We have an error: ' + err);
            res.status(500).send('I fucked this up :(');
        }
        if(results.length == 3) {
            //result[0] = Module, result[1] = Student, result[2] = EffortType
            var newEffort = new effortdb.effortModel();
            newEffort.amount = amount;
            newEffort.module = results[0]["_id"];
            newEffort.createdBy = results[1]["_id"];
			newEffort.type = results[2]["_id"];
			newEffort.performanceDate = new Date(performanceDate);
			// "<YYYY-mm-dd>" Format
			if(req.body.material) {
                newEffort.material = req.body.material;
            }
            if(req.body.place) {
                newEffort.place = req.body.place;
            } 
            newEffort.save(function(err, result) {
                if(err) {
					console.log(err);
					res.status(500).send("Failed to create effort");}
                else if(result) {
                    var message = {};
                    message.success = true;
                    message.id = result._id;
                    res.status(201).send(message);
                }
            })
        } else {
            res.status(400).send("User, module or effort type not in database");
        }
    });
};


exports.updateEffort = function(req, res) {
    //console.log(req.body);
    var modId = req.body.moduleid;
    var effId = req.params.effortid;
	var efftypeId = req.body.efforttypeid;
	var studId = req.headers['x-key'];

    async.parallel([
        function(callback) {

            console.log(modId + " " + effId + " " + efftypeId);
            moduledb.moduleModel.findById(modId, function(err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                if (result == undefined) {
                    callback("Module not found");
                } else {
                    callback(null, result);
                }
            });
        },
		function(callback) {
            efforttypedb.effTypeModel.findById(efftypeId, function(err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                if (result == undefined) {
                    callback("Effort Type not found");
                    return;
                } else {
                    callback(null, result);
                }
            });

        }
    ], function(err, results) {
        if(results.length == 2) {
			effortdb.effortModel.findById(effId, function(err, eff) {
                if (err){
                    return res.send(err);
                }
                if (eff.createdBy !== studId) {
                    return res.status(403).send("This is not your effort. Get lost.");
                } else {
                    eff.module = results[0]["_id"];
                    eff.type = results[1]["_id"];
                    eff.amount = req.body.amount;
                    eff.performanceDate = new Date(req.body.performanceDate);
                    // "<YYYY-mm-dd>" Format
                    if(req.body.material !== undefined) {
                        eff.material = req.body.material;
                    }
                    if(req.body.place !== undefined) {
                        eff.place = req.body.place;
                    }
                    // save the effort
                    eff.save(function(err, result) {
                        if(err) res.status(500).send("Failed to update effort");
                        else if(result) {
                            var message = {};
                            message.success = true;
                            message.id = result._id;
                            res.status(200).send(message);
                        }
                    });
                }
			});
        } else {
            res.status(400).send("Module or effort not in database");
        }
    });
};

exports.deleteEffort = function(req, res) {
	var effId = req.params.effortid;
	console.log(effId);
            // delete the effort
    effortdb.effortModel.findByIdAndRemove(effId, function(err, eff) {
        if (err) {
            res.status(500).send("Something went wrong");
        } else if (eff) {
            var result = {};
            result.id = eff._id;
            result.success = true;
            res.status(200).send(result);
        }
    });
};

