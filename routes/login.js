/**
 * Created by Kevin on 10/12/15.
 */

var identdb = require('../models/Identification.js');
var studentdb = require('../models/Student.js');
var moduledb = require('../models/Module');
var request = require('request');
var async = require('async');
var crypto = require('crypto');

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
        *
         */
        function(callback) {
            //console.log(req);
            //require('request-debug')(request);
            console.log("Requesting login from " + user + " - Sync?: " + sync);
            request({
                'uri':'https://cert-campus.frankfurt-school.de/clicnetclm/loginService.do?xaction=login&username=' + user + '&password=' + pass,
                'timeout':5000
            } , function(err, response, body) {
                //res.send("Go fuck yourself, BIAAAATSCH");

                try {
                    var userInfo = JSON.parse(body);
                } catch (e) {
                    var error = {'errormsg': e.message, 'ep_response':body};
                    return callback(error);
                }
                console.log('Did it work? ' + userInfo.success);
                if(userInfo.success) {
                    //console.log('Down the waterfall #1');
                    //console.log("Session: " + identEntry.jsession);
                    console.log("User logged in at Efiport");
                    callback(null, user, pass, userInfo);
                } else {
                    return callback("E0000", userInfo);
                }
            });
        },
        function(user, pass, userinfo ,callback) {
            var sessionBuffer = new Buffer(user+pass+userinfo.sessionid);
            var hashedSessionBuffer = crypto.createHash('sha256').update(sessionBuffer).digest('hex').toUpperCase();

            console.log('New user created. SessionID: ' + hashedSessionBuffer);
            userinfo.mysessionid = hashedSessionBuffer;
            //callback(userinfo); //TODO: For Loadtesting only -- needs to be removed
            return callback(null, userinfo);
        },
        function(userinfo, callback) {
            if(!sync) {
                return callback("E0001", userinfo);
            }

            console.log('Backend Session ID: ' + userinfo.mysessionid);
            console.log('Efiport Session ID: ' + userinfo.sessionid);
            console.log('Requesting Student Data...');


            var cookie = "JSESSIONID="+userinfo.sessionid;
            request({
                uri: 'https://cert-campus.frankfurt-school.de/clicnetclm/campusAppStudentX.do?xaction=getStudentData',
                headers: {
                    "Cookie": cookie
                }
            }, function(err, response, body) {
                if(err) {
                    console.log("Jesus christ I fucked up what the fuck is going on :O");
                    return callback("E0002");
                }
                console.log('Student data arrived....');
                var studentinfo = JSON.parse(body);
                userinfo.matricularnr = studentinfo.matrikelnummer;

                //console.log("in final function\n" + JSON.stringify(userinfo));
                return callback(null, userinfo, studentinfo);
            });
        },
        //TODO hier funktion für ident table
        function(userinfo, studentinfo, callback) {
            var identEntry = new identdb.identificationModel();
            identEntry.jession = userinfo.mysessionid;
            identEntry.matricularnr = userinfo.matricularnr;
            console.log(identEntry);
            identEntry.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return callback("Fucked UP!");
                } else {
                    return callback(null, userinfo, studentinfo);
                }
            });
            return callback(null, userinfo, studentinfo);

        },
        function(userinfo, studentinfo, callback) {
            //console.log(err);
            var modules = {};
            //console.log("in final function\n" + userinfo);
            console.log('Parsing student data...');
            studentinfo.items.forEach(function(item) {
                item.children.forEach(function(topLevelModule) {
                    if(topLevelModule.hasOwnProperty('children')) {
                        topLevelModule.children.forEach(function(module){
                            console.log(topLevelModule.title + " - " + module.title);
                            var curYear = new Date();
                            curYear = curYear.getFullYear();
                            if(curYear - module.year < 3) {
                                var mod_id = module.moduleid.slice(0, -1); //Strip off special character at the end
                                //var sessionBuffer = new Buffer(module.title);
                                //var hashedSessionBuffer = crypto.createHash('sha1').update(sessionBuffer).digest('hex');
                                //var moduleEntry =
                                modules[module.title] = {
                                    'm_name':module.title,
                                    'm_category': topLevelModule.title,
                                    'm_year': module.year,
                                    'm_id': mod_id,
                                    'm_effort_assignment': module.assignments,
                                    'm_effort_idependent': module.independenthours,
                                    'm_effort_contact': module.contacthours
                                };
                            }
                        });
                    }
                });
            });

            userinfo.modules = modules;
            console.log(JSON.stringify(userinfo, null, 3));
            return callback(null, userinfo);
        },
        //TODO: funktion student speichern mit ids von modulen
        //TODO: holen und verarbeiten in einer funktion
        function(userinfo, callback) {
            async.series([
                function(callback) {
                    studentdb.studentModel.count({_id: userinfo.matricularnr}, function(err, count) {
                        if(count > 0) {
                            return callback("Student already exists");
                        } else {
                            return callback()
                        }
                    });
                },
                function (callback) {
                    var studentEntry = new studentdb.studentModel();
                    studentEntry._id = userinfo.matricularnr;
                    var module_ids = [];
                    for(var module_item in userinfo.modules) {
                        module_ids.push(userinfo.modules[module_item].m_id);
                    }
                    studentEntry.modules = module_ids;
                    studentEntry.save(function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback("Fucked UP!");
                        } else {
                            userinfo.privacyFlag = result.privacyFlag;
                            return callback(null, userinfo);
                        }
                    });
                }
            ], function(err, result) {
                if(err) {
                    console.log(err);
                    return callback(null, userinfo);
                }
                else {
                    console.log("Added Student");
                    return callback(null, result);
                }
            });

        },
        function(userinfo, callback) {
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
                        mod.assignmentHours = moduleinfo.m_effort_assignment;
                        mod.contactHours = moduleinfo.m_effort_contact;
                        mod.independentHours = moduleinfo.m_effort_idependent;
                        mod.name = moduleinfo.m_name;
                        mod._id = moduleinfo.m_id;
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
                    if(err) console.log(err);
                    else if(result['worked'] == true) console.log("Success! Added Module " + result['added_module']);
                    return callback();
                });
            }, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("All modules in Database");
                }
            });
            return callback(null, userinfo)
        }
    ], function(err, result) {
        //console.log(err, result);
        if(result) {
            delete result.modules;
            delete result.sessionid;
        }
        if(err) {
            if(err == "E0000") res.status(403).send("Wrong Username or Password. Please try again.");
            if(err == "E0001")
            {
                res.status(200).send(result);
            }
            if(err.code == 2) res.status(500).send("Failed to fetch Modules. Please login again. If the error persists, contact you Systemadministrator");
        }
        res.send(result);

        console.log("Done...");
    });
}

exports.logout = function (req, res) {
    return res.status(200).send('User successfully logged out');
}

