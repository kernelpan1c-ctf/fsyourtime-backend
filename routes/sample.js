/**
 * Created by Kevin on 10/8/15.
 */

var studentdb = require('../models/Student.js');
var modules = require('./modules.js');
var coursedb = require('../models/Course.js');
var moduledb = require('../models/Module.js');
var effortdb = require('../models/Effort.js');
var effortCatdb = require('../models/EffCategory.js');
var db = require('../db');


exports.createSampleData = function (req, res) {

    var courses = ['122-WI', '122-IBA', '122-MPE', '122-BA'];
    var className = ['Wirtschaftsinformatik', 'International Business Administration',
        'Management, Philosophy & Economics', 'Business Administration'];
    var moduleCodes = ['ACC40020', 'ECO40020', 'QUM40020', 'ACC40040'];

    //Studenten 2012 anlegen
    for (var i = 0; i < 10; i++) {
        console.log(i);
        var newStudent = new studentdb.studentModel();
        newStudent._id = 'stud0000' + i;
        newStudent.course = courses[Math.floor(Math.random() * courses.length)];
        newStudent.privacyFlag = true;
        var studModules = [];
        studModules.push(moduleCodes[Math.floor(Math.random() * moduleCodes.length)]);
        newStudent.modules = studModules;
        console.log("Saving student: " + newStudent._id);
        newStudent.save(function (err) {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }
            else {
                console.log("Success");
            }
        });

        //effort erstellen
        /*
         var effort = new effortdb.effortModel();
         effort.amount = Math.floor((Math.random() * 10) + 1);
         effort.module = studModules;
         effort.matricularnr = newStudent._id;
         effort.category = effortCatID[Math.floor(Math.random() * effortCatID.length)];
         effort.save(function (err) {
         if (err) {
         console.log(err);
         return res.sendStatus(500);
         }
         else {
         return res.json(req.body);
         }
         });
         */
    }
};
