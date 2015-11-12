//var mongoose = require('mongoose');

//var studentdb = require('../models/Student.js');
var moduledb = require('../models/Module.js');
var studdb = require('../models/Student.js');
var identdb = require('../models/Identification.js');

//TODO: do we need this?
exports.getModule = function (req, res) {
  var id = req.params.id;
    moduledb.moduleModel.findOne({_id: id}, function (err, module) {
        if (err || module == undefined) {
            console.log(err);
            return res.sendStatus(404);
        }
        return res.json(module);
    })
};

//TODO: not needed, marked for deletion
exports.createModule = function (req, res) {
    var module = new moduledb.moduleModel(req.body);
    var studentid = req.matricularnr;
// TO do: module array per http -> only one api request for multiple modules
    module.save(function (err){
        if (err) {
            console.log(err);
            return res.sendStatus(401);
        }
        else {
            return res.json(req.body);
        }
        });

// Pushing new module reference into student data to keep references in sync
    studdb.studentModel.findOne({_id: studentid}, function (err, student) {
        if (err || student == undefined) {
            console.log(err);
            return res.sendStatus(401);
        }
        // TO-do for condition for module array
        // for (var module in modules) {}
        student.modules.push(module);
        student.save();
    })
};
//TODO: not needed, marked for deletion
exports.deleteModule = function (req, res) {
    var studentid = req.headers['x-key'];
    var moduleid = req.params.id;

    moduledb.moduleModel.remove({_id: moduleid}, function (err) {
        if (err){
            console.log(err);
            return res.sendStatus(401);
        }
    });
    //Keeping references in sync -> delete objectid in students:
    studdb.studentModel.find({modules: moduleid}, function (err, students) {
        if (err || students == undefined) {
            console.log(err);
            return res.sendStatus(401);
        }
        var student;
        for (student in students){
            student.modules.remove(moduleid);
            student.save();
        }
        return res.sendStatus(200);
    })
};

exports.getModulesByStudent = function (req, res) {
    // Student can view a list of his modules
    // Result contains all information about the modules, however, not all must be used
    //var session = req.headers['jsessionid'];
    // req.sessionID ??
    var studentid = req.headers['x-key'];
    console.log(studentid);
    studdb.studentModel.findOne({_id: studentid}).populate('modules').exec(function(err, result) {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(result.modules);
        }
    });
};