/**
 * Created by Kevin on 10/8/15.
 */

var studentdb = require('../models/Student.js');
var moduledb = require('../models/Module.js');
var effortdb = require('../models/Effort.js');
var efftypedb = require('../models/EffType');
var async = require('async');

exports.createSampleEfforts = function(req, res) {
    var numSamples = req.params.sets;
    async.parallel([
        function(callback) {
            var studentIDs = [];
            studentdb.studentModel.find({}, function(err, students) {
                if(err) console.log(err)
                if(students.length > 0) {
                    students.forEach(function(student) {
                        studentIDs.push(student._id);
                    })
                }
                callback(null, studentIDs);
            });

        },
        function(callback) {
            var moduleIDs = [];
            moduledb.moduleModel.find({}, function(err, modules) {
                if(err) console.log(err);
                if(modules.length > 0) {
                    modules.forEach(function(module) {
                        moduleIDs.push(module._id);
                    })
                }
                callback(null, moduleIDs);
            });

        },
        function(callback) {
            var effTypeIDs = [];
            efftypedb.effTypeModel.find({}, function(err, effTypes) {
                if(effTypes.length > 0) {
                    effTypes.forEach(function(effType) {
                        effTypeIDs.push(effType._id);
                    })
                }
                callback(null, effTypeIDs);
            });

        }
    ], function(err, result) {
        var i = 0;
        async.whilst(
            function() { return i <= numSamples},
            function(callback) {
                var newEffort = new effortdb.effortModel();
                newEffort.amount = Math.floor(Math.random()*50+1);
                newEffort.module = result[1][Math.floor(Math.random()*result[1].length)];
                newEffort.createdBy = result[0][Math.floor(Math.random()*result[0].length)];
                newEffort.type = result[2][Math.floor(Math.random()*result[2].length)];
                newEffort.performanceDate = new Date(Date.now());
                newEffort.save(function(err, result) {
                    if(err) {
                        callback(err);
                    } else if(result) {
                        var message = {};
                        message.success = true;
                        message.id = result._id;
                        if(i%5000==0) console.log("Creating efforts " + i + "/" + numSamples);
                        //console.log("Created effort " + message.id);
                        i++;
                        callback();
                    }
                })
            }, function(err, result) {
                if(err) console.log(err);
                console.log("Done.");
                res.status(200).send("Created " + numSamples + " sample data");
            });

    });
}

/*
exports.createSampleData = function (req, res) {

    console.log('Removing Collections...');
    studentdb.studentModel.remove({},function(err, res) { console.log(res)});
    moduledb.moduleModel.remove({} , function(err, res) { console.log(res)});
    effortdb.effortModel.remove({}, function(err, res) { console.log(res)});

    var courses = ['122-WI', '122-IBA', '122-MPE', '122-BA'];
    //var className = ['Wirtschaftsinformatik', 'International Business Administration',
    //    'Management, Philosophy & Economics', 'Business Administration'];
    var moduleCodes = ['ACC40020', 'ECO40020', 'QUM40020', 'ACC40040'];
    var students = [];

    console.log("Creating stundents...");
    //Teststudenten
    for (var i = 0; i < 10; i++) {
        //console.log(i); //debugging only
        var newStudent = new studentdb.studentModel();
        newStudent._id = Math.floor((Math.random() * 9999999) + 1);
        newStudent.course = courses[Math.floor(Math.random() * courses.length)];
        newStudent.privacyFlag = true;
        var studModules = [];
        studModules.push(moduleCodes[Math.floor(Math.random() * moduleCodes.length)]);
        newStudent.modules = studModules;
        //console.log(newStudent);
        students.push(newStudent);
        console.log("#" + i + " Saving student: " + newStudent._id);
        newStudent.save(function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send('Commander, we fucked up!');
            }
            else {
                //console.log("Success!");
            }
        });
    }

    for (var i = 0; i < moduleCodes.length; i++) {
        var newModule = new moduledb.moduleModel();
        newModule._id = 'mod0000' + i;
        newModule.name = moduleCodes[i];
        newModule.workloadHours = 150;
        newModule.assignmentHours = 90;
        newModule.contactHours = 40;
        newModule.independentHours = 20;
        console.log('#' + i + ' Saving Module: ' + newModule._id);
        newModule.save(function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send('Commander, we fucked up!\n'+err);
            } else {
               // console.log('Success! ');
            }
        });
    }

    for (var i = 0; i < 20; i++) {
        var theChosenOne = Math.floor((Math.random() * students.length-1) + 1);
        console.log('Index: ' + theChosenOne + ' | ' + ' Max Index: ' + (students.length-1));
        var creator = students[theChosenOne];
        var newEffort = new effortdb.effortModel();
        console.log(newEffort);
        console.log(creator);
        newEffort.amount = Math.floor((Math.random() * 20) + 1);
        newEffort.module = "mod00001";
        newEffort.studentid = creator._id;
        newEffort.category = "Assignment";
        console.log("Saving new effort: " + newEffort._id);
        newEffort.save(function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send('Commander, we fucked up!\n' + err);
            } else {
                console.log('Success!');
            }
        });
    }

    res.send('Yay we are done!');
}
*/