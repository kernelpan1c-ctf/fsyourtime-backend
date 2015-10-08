//var mongoose = require('mongoose');

//var studentdb = require('../models/Student.js');
var moduledb = require('../models/Module.js');
var studdb = require('../models/Student.js');
//var identdb = require('../models/Identification.js');

exports.getModule = function (req, res) {
  var id = req.params.id;
    moduledb.moduleModel.findOne({_id: id}, function (err, module) {
        if (err || module == undefined) {
            console.log(err);
            return res.sendStatus(401);
        }
        return res.json(module);
    })
};

exports.checkModules = function (paramStudent){
    studdb.studentModel.findById(paramStudent._id, function (err, student) {
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

exports.deleteModule = function (req, res) {
    var studentid = req.params.studentid;
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

exports.updateModule = function (req, res) {
    console.log("update");
};

exports.getMyModules = function (req, res) {
    // Student can view a list of his modules
    // Result contains all information about the modules, however, not all must be used
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
    var modulelist = [];
    studdb.studentModel.findOne({_id: matricularnr}, function (err, student) {
            if (err) {
                console.log(err);
            }
            else {
                modulelist = student.modules
            }
        }
    );
    moduledb.moduleModel.find({_id: {$in: modulelist}}, function (err, modules) {
        if (err) {
            console.log(err);
        }
        else {
            res.json(modules)
        }
    });
};

exports.getModuleById = function (req, res) {
    // Get a Module by ID
    // Result contains all information about the module, however, not all must be used
    moduledb.moduleModel.findbyId(req.params.id, function (err, module) {
        if (err) {
            console.log(err);
        }
        else {
            res.json(module)
        }
    });
};

exports.getModuleByName = function (req, res) {
    // Get a Module by its name
    // Result contains all information about the module, however, not all must be used
    moduledb.moduleModel.findOne({name: req.params.name}, function (err, module) {
        if (err) {
            console.log(err);
        }
        else {
            res.json(module)
        }
    });
};