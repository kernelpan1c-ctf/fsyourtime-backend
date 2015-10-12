/**
 * Created by Kevin on 10/8/15.
 */

var mongoose = require("mongoose");
var studentdb = require('../models/Student.js');
var modules = require('./modules.js');
//var coursedb = require('../models/Course.js');
var moduledb = require('../models/Module.js');
var effortdb = require('../models/Effort.js');
//var effortCatdb = require('../models/EffCategory.js');
//var db = require('../db');


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
