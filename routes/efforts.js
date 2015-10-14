/**
 * Created by Kevin on 10/5/15.
 */

var effortdb = require('../models/Effort.js');
var studdb = require('../models/Student.js');
var identdb = require('../models/Identification.js');

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

exports.createEffort = function(req, res) {
    var amount = req.body.amount;
    var module = req.body.module;
    var student = req.body.student;

    res.send("Created new effort: \n\tAmount: " + amount + "\n\tModule: " + module + "\n\tStudent: " + student);

}

//TODO: Implement update method (Use PUT)
//TODO: Implement insert method (USE POST)
//TODO: Validate Effort (update/enter) --> Date of effort not more than 2 weeks in past!

