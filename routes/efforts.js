/**
 * Created by Kevin on 10/5/15.
 */

var effortdb = require('../models/Effort.js');
var studdb = require('../models/Student.js');
var identdb = require('../models/Identification.js');
var moduledb = require('../models/Module');
var efforttypedb = require('../models/EffType');
var async = require('async');

exports.getEffortsByStudent = function (req, res) {
    // Student can view a list of his efforts
    // Result contains all information about the efforts, however, not all must be used
    var session = req.headers['jsessionid'];
    // req.sessionID ??
    var matricularnr;
    identdb.findOne({jsession: session}, function (err, identification) {
        if (err) {
            console.log(err);
        }
        else {
            matricularnr = identification.relmatricularnr;
        }
    });
    // find out which student is logged in
    var effortlist = [];
    studdb.studentModel.findOne({_id: matricularnr}, function (err, student) {
        if (err) {
            console.log(err);
        }
        else {
            effortlist = student.efforts;
        }
    });
    // get all the efforts a student has registered
    effortdb.effortModel
        .find({_id: {$in: effortlist}})
        .populate({
            path: 'module'
        },
        {
            path: 'type',
            select: 'name relcategory'
        })
        .exec(function (err, efforts) {
            if (err) {
                console.log(err);
            }
            else {
                res.json(efforts);
            }
        });
    // get the information about efforts through population
};

exports.getEffortById = function (req, res) {
    // Get an Effort by ID
    effortdb.effortModel.findbyId(req.params.id, function (err, effort) {
        if (err) {
            console.log(err);
        }
        else {
            res.json(effort);
        }
    });
};

exports.getEffortsByModule = function (req, res) {
    // Student can view a list of his efforts when selecting a module
    // Result contains all information about the efforts, however, not all must be used
    var session = req.headers['jsessionid'];
    // req.sessionID ??
    var matricularnr;
    identdb.findOne({jsession: session}, function (err, identification) {
        if (err) {
            console.log(err);
        }
        else {
            matricularnr = identification.relmatricularnr;
        }
    });
    // find out which student is logged in
    var effortlist = [];
    studdb.studentModel.find({_id: matricularnr}, function (err, student) {
        if (err) {
            console.log(err);
        }
        else {
            effortlist = student.efforts;
        }
    });
    // get all the efforts a student has registered
    effortdb.effortModel
        .find({_id: {$in: effortlist}, module: req.params.moduleid})
        .populate({
            path: 'module'
        },
        {
            path: 'type',
            select: 'name relcategory'
        })
        .exec(function (err, efforts) {
            if (err) {
                console.log(err);
            }
            else {
                res.json(efforts);
            }
        });
    // get the information about efforts through population, select only where module is the given moduleid
};


exports.getEffortsByType = function (req, res) {
    // Student can view a list of his efforts when selecting a type
    // Result contains all information about the efforts, however, not all must be used
    var session = req.headers['jsessionid'];
    // req.sessionID ??
    var matricularnr;
    identdb.findOne({jsession: session}, function (err, identification) {
        if (err) {
            console.log(err);
        }
        else {
            matricularnr = identification.relmatricularnr;
        }
    });
    // find out which student is logged in
    var effortlist = [];
    studdb.studentModel.find({_id: matricularnr}, function (err, student) {
        if (err) {
            console.log(err);
        }
        else {
            effortlist = student.efforts;
        }
    });
    // get all the efforts a student has registered
    effortdb.effortModel
        .find({_id: {$in: effortlist}, type: req.params.efftypeid})
        .populate({
            path: 'module'
        },
        {
            path: 'type',
            select: 'name relcategory'
        })
        .exec(function (err, efforts) {
            if (err) {
                console.log(err);
            }
            else {
                res.json(efforts);
            }
        });
    // get the information about efforts through population, select only when type is the given typeid
};
/*
 exports.createEffort = function(req, res) {
 var amount = req.body.amount;
 var module = req.body.module;
 var student = req.body.studentid;

 res.send("Created new effort: \n\tAmount: " + amount + "\n\tModule: " + module + "\n\tStudent: " + student);

 }
 */
exports.createEffort = function(req, res) {
    //console.log(req.body);
    async.parallel([
        function(callback) {
            moduledb.moduleModel.findById(req.body.moduleid, function(err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                if (result == undefined) {
                    console.log("Module not found");

                    callback("Module not found");
                } else {
                    callback(null, result);
                }
            });
        },
        function(callback) {
            studdb.studentModel.findById(req.body.studentid, function(err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                if (result == undefined) {
                    console.log("Student");

                    callback("Student");
                } else {
                    callback(null, result);
                }
            });

        }
    ], function(err, results) {
        if(results) {
            //result[0] = Module, result[1] = Student
            var newEffort = new effortdb.effortModel();
            newEffort.amount = req.body.amount;
            newEffort.module = results[0]["_id"];
            newEffort.createdBy = results[1]["_id"];
            newEffort.save(function(err, result) {
                if(err) res.status(500).send("Failed to create effort");
                else if(result) res.status(200).send(result);
            })
            //console.log(newEffort);
            //res.status(200).send(newEffort);
        }
    });
    return;
    var newEffort = new effortdb.effortModel();
    newEffort.amount = req.body.amount;
    newEffort.module = moduledb.moduleModel.findOne({name: req.body.module}).exec();
    //newEffort.type = efforttypedb.effTypeModel.findOne({name: req.body.type}).exec();
    newEffort.matricularnr = studdb.studentModel.findById(req.body.matricularnr).exec();
    newEffort.performanceDate = new Date(req.body.performanceDate); // "<YYYY-mm-dd>" Format
    newEffort.material = req.body.material;
    newEffort.place = req.body.place;

    console.log(JSON.stringify(newEffort), null, 3);

    newEffort.save(function(err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        else {
            return res.send(newEffort);
        }
    });
};

exports.updateEffort = function(req, res) {
    var newamount = req.body.amount;
    var newmodule = moduledb.moduleModel.findOne({name: req.body.module});
    var newtype = efforttypedb.effTypeModel.findOne({name: req.body.type});
    var newperformanceDate = new Date(req.body.performanceDate); // "<YYYY-mm-dd>" Format
    var newcreationDate = new Date();
    var newmaterial = req.body.material;
    var newplace = req.body.place;

    efforttypedb.findByIdAndUpdate(req.params.effortid, {amount: newamount, module: newmodule, type: newtype, performanceDate: newperformanceDate, creationDate: newcreationDate, material: newmaterial, place: newplace},function (err, effort) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        else {
            return res.send('We did it!');
        }
    });
};


exports.deleteEffort = function(req, res) {
    effortdb.findByIdAndRemove(req.params.effortid, function (err) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        else { return res.sendStatus(200)}
    });


};


exports.deleteAllMyEfforts = function(req, res) {
    effortdb.remove({matricularnr: req.params.matricularnr}, function (err) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        else { return res.sendStatus(200)}
    });


};
//TODO: Validate Effort (update/enter) --> Date of effort not more than 2 weeks in past!
