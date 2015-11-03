/**
 * Created by Kevin on 10/12/15.
 */

var identdb = require('../models/Identification.js');
var studentdb = require('../models/Student.js');
var moduledb = require('../models/Module');
var request = require('request');
var async = require('async');
var crypto = require('crypto');

//TODO: Implement logging and replace "console.log" with logger

exports.login = function (req, res) {
    //console.log(req);
    var user = req.body.username;
    var pass = req.body.password;
    var sync = req.body.syncdata;
    res.setTimeout(20*60*1000);

    //res.setTimeout(5000);
    async.waterfall([
        /*
        *
        * Errorcodes:
        *
        *   E0000       Login failed
        *   E0001       Login Successfull, Sync not required
        *   E0002       Failed to reach getStudentData
        *   E0003       Efiport not reachable
        *
         */
        function(callback) {
            //require('request-debug')(request);
            console.log("Requesting login from " + user + " - Sync?: " + sync);
            request({
                'uri':'https://campus.frankfurt-school.de/clicnetclm/loginService.do?xaction=login&username=' + user + '&password=' + pass,
                'timeout':5000,
                'headers': {
                    'apiKey': 'd299ef13-a197-4c36-8948-e0112da3bdf2Ä'
                }
            } , function(err, response, body) {
                try {
                    var userInfo = JSON.parse(body);
                } catch (e) {
                    return callback("E0003");
                }
                console.log('Did it work? ' + userInfo.success);
                if(userInfo.success) {
                    console.log("User logged in at Efiport");
                    var userid = new Buffer(userInfo.fullname);
                    var hashedUserid = crypto.createHash('md5').update(userid).digest('hex').toUpperCase();
                    userInfo.userid = hashedUserid;
                    callback(null, user, pass, userInfo);
                } else {
                    return callback("E0000", userInfo);
                }
            });
        },
        function(user, pass, userinfo ,callback) {
            //console.log(userinfo);
            var sessionBuffer = new Buffer(user+pass+userinfo.sessionid);
            var hashedSessionBuffer = crypto.createHash('sha256').update(sessionBuffer).digest('hex').toUpperCase();
            console.log('New user created. SessionID: ' + hashedSessionBuffer);
            userinfo.mySessionId = hashedSessionBuffer;
            return callback(null, userinfo);
        },
        function(userInfo, callback) {
            if(!sync) {
                return callback("E0001", userInfo);
            }

            console.log('Backend Session ID: ' + userInfo.mySessionId);
            console.log('Efiport Session ID: ' + userInfo.sessionid);
            console.log('Requesting Student Data...');


            var cookie = "JSESSIONID="+userInfo.sessionid + "; SERVERID=fs-bl-02";
            //console.log(cookie);
            request({
                uri: 'https://campus.frankfurt-school.de/clicnetclm/campusAppStudentX.do?xaction=getStudentData',
                headers: {
                    "Cookie": cookie,
                    "apiKey": "d299ef13-a197-4c36-8948-e0112da3bdf2"
                }
            }, function(err, response, body) {
                if(err) {
                    console.log("Jesus christ I fucked up what the fuck is going on :O");
                    return callback("E0002");
                }
                console.log('Student data arrived....');
                var studentInfo = JSON.parse(body);
                //console.log(studentInfo);
                userInfo.matricularnr = studentInfo.matrikelnummer;
                //console.log(userInfo);
                return callback(null, userInfo, studentInfo);

            });
        },
        //TODO hier funktion für ident table
        function(userInfo, studentInfo, callback) {
            var identEntry = new identdb.identificationModel();
            identEntry.jsession = userInfo.mySessionId;
            identEntry.studentid = userInfo.userid;
            identEntry.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Fucked UP!");
                } else {
                    return callback(null, userInfo, studentInfo);
                }
            });
        },
        function(userInfo, studentInfo, callback) {
            //console.log(err);
            if(!studentInfo.success)  return callback("E0002");
            var modules = {};

            //console.log("in final function\n" + userInfo);
            console.log('Parsing student data...');
            studentInfo.items.forEach(function(item) {
                item.children.forEach(function(topLevelModule) {
                    if(topLevelModule.hasOwnProperty('children')) {
                        topLevelModule.children.forEach(function(module){
                            var curYear = new Date();
                            curYear = curYear.getFullYear();
                            if(curYear - module.year < 3) {
                                var idBuffer = new Buffer(module.title);
                                var hashedIdBuffer = crypto.createHash('sha1').update(idBuffer).digest('hex');
                                modules[module.title] = {
                                    'm_id': hashedIdBuffer,
                                    'm_name':module.title,
                                    'm_year': module.year,
                                    'm_effort_assignment': module.assignments,
                                    'm_effort_idependent': module.independenthours,
                                    'm_effort_contact': module.contacthours
                                };
                            }
                        });
                    }
                });
            });

            userInfo.modules = modules;
            return callback(null, userInfo);
        },
        function(userInfo, callback) {
            async.series([
                function(callback) {
                    studentdb.studentModel.count({_id: userInfo.userid}, function(err, count) {
                        if(count > 0) {
                            return callback("Student already exists");
                        } else {
                            return callback()
                        }
                    });
                },
                function (callback) {
                    //console.log(userInfo);
                    var studentEntry = new studentdb.studentModel();
                    studentEntry._id = userInfo.userid;
                    studentEntry.matricularnr = userInfo.matricularnr;
                    var module_ids = [];
                    for(var module_item in userInfo.modules) {
                        module_ids.push(userInfo.modules[module_item].m_id);
                    }
                    studentEntry.modules = module_ids;
                    studentEntry.save(function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback("Fucked UP!");
                        } else {
                            userInfo.privacyFlag = result.privacyFlag;
                            return callback(null, userInfo);
                        }
                    });
                }
            ], function(err, result) {
                if(err) {
                    console.log(err);
                    return callback(null, userInfo);
                }
                else {
                    console.log("Added Student");
                    return callback(null, result);
                }
            });

        },
        function(userinfo, callback) {
            //console.log(userinfo);
            async.each(userinfo.modules, function(moduleinfo, callback) {
                //here goes calls to save all modules in the database...
                //console.log(JSON.stringify(moduleinfo, null, 3));
                async.series([
                    function(callback) {
                        moduledb.moduleModel.count({_id:moduleinfo.m_id}, function(err, count) {
                            if (count > 0) {
                                return callback("Module already exists...");
                            } else {
                                return callback();
                            }
                        });
                    },
                    function(callback) {
                        var mod = new moduledb.moduleModel();
                        mod._id = moduleinfo.m_id;
                        mod.assignmentHours = moduleinfo.m_effort_assignment;
                        mod.contactHours = moduleinfo.m_effort_contact;
                        mod.independentHours = moduleinfo.m_effort_idependent;
                        mod.name = moduleinfo.m_name;
                        mod.save(function (err) {
                            if (err) {
                                console.log(err);
                                return callback("Fucked UP!");
                            } else {
                                var res = {'worked':true, 'added_module':mod._id};
                                return callback(null, res);
                            }
                        });
                    }
                ], function(err, result) {
                    //console.log(result);
                    if(err) console.log(err);
                    else if(result[1]['worked']) console.log("Success! Added Module " + result[1]['added_module']);
                    return callback();
                });
            }, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("All modules in Database");
                    return callback(null, userinfo)
                }
            });

        }
    ], function(err, result) {
        //console.log("----[ ERR ]----");
        //console.log(err);
        //console.log("----[ RESULT ]----");
        //console.log(result);
        if(err) {
            if(err == "E0000") res.status(403).send("Wrong Username or Password. Please try again.");
            if(err == "E0001") {
                studentdb.studentModel.findOne({_id: result.userid}, function(err, student) {
                    if(!student) res.status(500).send("Modules have not been synced yet. Please login again and check the 'syncdata' button");
                    if(student) {
                        //console.log(student);
                        result.privacy = student.privacyFlag;
                        result.matricularnr = student.matricularnr;
                        //console.log(result);
                        //console.log(result);
                        res.status(200).send(result);
                    }
                });
            }
            if(err == "E0002")
            {
                res.status(500).send("Failed to fetch Modules. Please login again. If the error persists, contact you Systemadministrator");
            }
            if(err == "E0003") res.status(500).send("Failed validate login against efiport.");

        } else if (result) {
            if(result.length > 1) result = result[1];
            //console.log("I'm here");
            delete result.modules;
            delete result.sessionid;

            //console.log(result.length);

            studentdb.studentModel.findOne({_id: result.userid}, function (err, student) {
                if (!student) res.status(500).send("Flopped");
                if (student) {
                    //console.log(student);
                    result.privacy = student.privacyFlag;
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
        }

        console.log("Done...");
    });
}

exports.logout = function (req, res) {
    var session = req.headers["x-session"];
    console.log(session);
    identdb.identificationModel.findOneAndRemove({jsession: session}, function(err, result){
        if(err) res.status(500).send("Something went wrong");
        if(!result) res.status(404).send("Session not found");
        if(result) {
            return res.status(200).send('User successfully logged out' + result);
        }
    });

}

