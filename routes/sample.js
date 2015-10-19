/**
 * Created by Kevin on 10/8/15.
 * Update by Twolf on 10/16/15.
 */

var mongoose = require("mongoose");
var studentdb = require('../models/Student.js');
var modules = require('./modules.js');
var coursedb = require('../models/Course.js');
var moduledb = require('../models/Module.js');
var effortdb = require('../models/Effort.js');
var effortcatdb = require('../models/EffCategory.js');
var efforttypedb = require('../models/EffType.js');
var db = require('../db');


exports.createSampleData = function (req, res) {

    console.log('Removing Collections...');
    studentdb.studentModel.remove({},function(err, res) { console.log(res)});
    moduledb.moduleModel.remove({} , function(err, res) { console.log(res)});
    effortdb.effortModel.remove({}, function(err, res) { console.log(res)});
	effortcatdb.effCategoryModel.remove({}, function(err, res) { console.log(res)});
	efforttypedb.effTypeModel.remove({}, function(err, res) { console.log(res)});
	coursedb.courseModel.remove({}, function(err, res) { console.log(res)});
	
	
	var effCategories = ['Praesenz', 'Aufgaben', 'Selbstlernen'];
	var effCatDescrp = ['Anwesenheit in Vorlesungen', 'Bearbeiten von Aufgaben', 'Pruefungsvorbereitung und Wiederholung des Vorlesungsstoffs'];
	
	var effTypes = ['Pruefungsvorbereitung', 'Aufgaben', 'Praesentationen', 'Paper', 'Gruppenarbeit'];
	var effTyDescrp = ['Lernen fuer Klausuren', 'Bearbeiten von Aufgaben', 'Vorbereitung von Praesentationen', 'Paper schreiben', 'In einer Gruppe arbeiten'];
    var effTyRelCat = ['Selbstlernen', 'Aufgaben', 'Aufgaben', 'Aufgaben', 'Aufgaben'];
	
	var courses = ['WI','IBWL','MPE'];
	var courseClassOf = [122, 152];
	
	var modules = ['Praxisprojekt', 'Finance', 'Wirtschaftsinformatik', 'Mathematik', 'Statistik'];
	
	var places = ['Bibliothek', 'Cafeteria', 'zuhause'];
	var materials = ['Buch', 'Computer', 'Stift und Block'];
	
	
	for (var i = 0; i < 3; i++){
		var newEffCat = new effortcatdb.effCategoryModel();
		newEffCat.name = effCategories[i];
		newEffCat.description = effCatDescrp[i];
		newEffCat.save(function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send('Commander, we fucked up!');
            }
            else {
                console.log("Success!");
            }
        });
	}
	
	for (var i = 0; i < 5; i++){
		var newEffType = new efforttypedb.effTypeModel();
		newEffType.name = effTypes[i];
		newEffType.description = effTyDescrp[i];
		newEffType.relcategory = effortcatdb.effCategoryModel.findOne({name: effTyRelCat[i]}, {name: 0, description: 0})._id;
		newEffType.save(function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send('Commander, we fucked up!');
            }
            else {
                console.log("Success!");
            }
        });
	}
	
	
	for (var i = 0; i < 3; i++){
		for (var j = 0; j < 2; j++){
		  var newCourse = new coursedb.courseModel();
	      newCourse.name = courses[i];
		  newCourse.classOf = courseClassOf[j];
console.log('saving Course: ' + newCourse._id);
		  newCourse.save(function (err) {
              if (err) {
                  console.log(err);
                  return res.status(500).send('Commander, we fucked up!');
              }
              else {
                  console.log("Success!");

              }
          })
		};
	}
	
	
var students = [];
	
    for (var i = 0; i < modules.length; i++) {
        var newModule = new moduledb.moduleModel();
        newModule._id = 'mod0000' + i;
        newModule.name = modules[i];
        newModule.workloadHours = 160;
		newModule.assigmentHours = (i+3)*10;
        newModule.contactHours = (i+2)*10;
        newModule.independentHours = 160 - ((i+3)*10) - ((i+2)*10);
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
	
    console.log("Creating stundents...");
    //Teststudenten
    for (var i = 0; i < 10; i++) {
        //console.log(i); //debugging only
        var newStudent = new studentdb.studentModel();
        newStudent._id = Math.floor((Math.random() * 9999999) + 1);
		var studCourseName = courses[Math.floor(Math.random() * courses.length)];
		var studCourseYear = courseClassOf[Math.floor(Math.random() * courseClassOf.length)];
        newStudent.course = coursedb.courseModel.findOne({name: studCourseName, classOf: studCourseYear})._id;
        newStudent.privacyFlag = true;
		get_module_id = function(e,doc) { return doc._id; };
        newStudent.modules = moduledb.moduleModel.find({},{name: 0, workloadHours: 0, contactHours: 0, independentHours: 0, assignmentHours: 0, __v: 0}).map( get_module_id );
        console.log(newStudent);
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



    for (var i = 0; i < 20; i++) {
        var theChosenOne = Math.floor((Math.random() * students.length-1) + 1);
        console.log('Index: ' + theChosenOne + ' | ' + ' Max Index: ' + (students.length-1));
        var creator = students[theChosenOne];
        var newEffort = new effortdb.effortModel();
        console.log(newEffort);
        console.log(creator);
        newEffort.amount = Math.floor((Math.random() * 20) + 1);
        newEffort.module = creator.modules[0]; //see in db
        newEffort.studentid = creator._id;
		var typeOfEffort = effTypes[Math.floor(Math.random() * effTypes.length)];
        newEffort.type = efforttypedb.effTypeModel.findOne({name: typeOfEffort});
		newEffort.performanceDate = new Date();
		newEffort.material = materials[Math.floor(Math.random() * materials.length)];
		newEffort.place = places[Math.floor(Math.random() * places.length)];
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
};
