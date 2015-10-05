var mongoose = require('mongoose');

var db = require('../models/Module.js');
var studentdb = require('../models/Student.js');

exports.getModule = function (req, res) {
  var id = req.params.id;
    db.moduleModel.findOne({_id: id}, function (err, module) {
        if (err || module == undefined) {
            console.log(err);
            return res.sendStatus(401);
        }
        return res.json(module);
    })
};

exports.checkModules = function (paramStudent){
    studentdb.studentModel.findById(paramStudent._id, function(err, student){
        if (err) {
            console.log(err);
            return 0;
        }
        if (student.modules != paramStudent.modules){
            student.modules = paramStudent.modules;
            student.save();
            return 1;
        }
    });


};

exports.createModule = function (req, res) {
    var module = new db.moduleModel(req.body);
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
    studentdb.studentModel.findOne({_id: studentid}, function (err, student) {
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

exports.deleteModule = function (req, res) {
    var studentid = req.params.studentid;
    var moduleid = req.params.id;

    db.moduleModel.remove({_id : moduleid}, function(err){
        if (err){
            console.log(err);
            return res.sendStatus(401);
        }
    });
    //Keeping references in sync -> delete objectid in students:
    studentdb.studentModel.find({modules: moduleid}, function (err, students){
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

exports.updateModule = function (req, res) {
console.log("update");
};