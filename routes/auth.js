/**
 * Created by Kevin on 10/12/15.
 */

var identdb = require('../models/Identification.js');
var studentdb = require('../models/Student.js');
var moduledb = require('../models/Module');
var request = require('request');
var async = require('async');
var crypto = require('crypto');
var logger = require('../lib/logger').getLogger({'module': 'auth'});
//var reqLogger = require('../lib/logger').requestLogger();


//TODO: Implement logging and replace "console.log" with logger

exports.login = function (req, res) {
    //console.log(req.flowid);
    //console.log(req);
    var user = req.body.username;
    var pass = req.body.password;
    var sync = req.body.syncdata;
    res.setTimeout(20 * 60 * 1000);
    require('request-debug')(request, function (type, data, r) {
        //console.log(type, data, r);
        if (type == 'request') {
            var uri = data.uri.replace(/password=(.*)/g, 'password=**************');
            logger.info("Sending request. uri=" + uri + " headers=" + JSON.stringify(data.headers) + " method=" + data.method, {flowid: req.flowid});
        }
    });

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
        function (callback) {
            var fsuser = {};
            fsuser.campusUsername = user;
            var userid = new Buffer(fsuser.campusUsername);
            var hashedUserid = crypto.createHash('md5').update(userid).digest('hex').toUpperCase();
            fsuser.userid = hashedUserid;
            //console.log(fsuser);
            callback(null, fsuser);
        },
        function (fsuser, callback) {
            logger.info("Requesting login from " + user, {flowid: req.flowid});
            request({
                'uri': 'https://campus.frankfurt-school.de/clicnetclm/loginService.do?xaction=login&username=' + user + '&password=' + encodeURIComponent(pass),
                'timeout': 10000, //10 seconds timeout on login
                'headers': {
                    'apiKey': 'd299ef13-a197-4c36-8948-e0112da3bdf2'
                }
            }, function (err, response, body) {
                try {
                    var efiResponse = JSON.parse(body);
                    if (efiResponse.success) {
                        fsuser.loginSuccess = true;
                        fsuser.loginSession = efiResponse.sessionid;
                        return callback(null, fsuser);
                    } else {
                        return callback("E0000", userInfo);
                    }
                } catch (e) {
                    return callback("E0003", e);
                }
            });
        },
        function (fsuser, callback) {
            var sessionBuffer = new Buffer(fsuser.campusUsername + "|" + Date.now());
            var hashedSessionBuffer = crypto.createHash('sha256').update(sessionBuffer).digest('hex').toUpperCase();
            fsuser.token = hashedSessionBuffer;
            return callback(null, fsuser);
        },
        function (fsuser, callback) {
            studentdb.studentModel.findOne({_id: fsuser.userid}, function (err, student) {
                if (err) res.status(500).send("Something went wrong. Please try again!");
                if (!student) {
                    fsuser.implicitSync = true;
                    callback(null, fsuser);
                }
                if (student) {
                    fsuser.implicitSync = false;
                    fsuser.privacyFlag = student.privacyFlag;
                    fsuser.matricularnr = student.matricularnr;
                    callback(null, fsuser);
                }
            });
        },
        function (fsuser, callback) {
            //console.log(fsuser);
            if (!fsuser.implicitSync) {
                logger.info("Student is already in sync. Skipping API call to Efiport!", {flowid: req.flowid});
                return callback(null, fsuser);
            }

            logger.info('Requesting Student Data for ' + fsuser.userid + "[" + fsuser.campusUsername + "]", {flowid: req.flowid});
            fsuser.apiSuccess = false;
            var tries = 0;
            async.whilst(
                function() { return (tries < 1 && !fsuser.apiSuccess) },
                function(callback) {
                    var cookie = "JSESSIONID=" + fsuser.loginSession + "; SERVERID=fs-bl-02";
                    //console.log(cookie);
                    request({
                        uri: 'https://campus.frankfurt-school.de/clicnetclm/campusAppStudentX.do?xaction=getStudentData',
                        headers: {
                            "Cookie": cookie,
                            "apiKey": "d299ef13-a197-4c36-8948-e0112da3bdf2"
                        }
                    }, function (err, response, body) {
                        if (err) {
                            tries++;
                            //console.log("Failed. Try Again after 1 second " + fsuser.apiSuccess + " " + tries + " " + body);
                            //logger.error("Efiport call failed. Response: " + body, {flowid: req.flowid});
                            setTimeout(callback(), 1000);
                        }
                        var studentInfo = JSON.parse(body);
                        if (!studentInfo.success) {
                            tries++;
                            //console.log("Failed. Try Again after 1 second " + fsuser.apiSuccess + " " + tries + " " + studentInfo["message"]);
                            //logger.error("Efiport call failed. Response: " + studentInfo["message"], {flowid: req.flowid});
                            setTimeout(callback(), 1000);
                        }
                        if (studentInfo.success) {
                            fsuser.unparsedResponse = studentInfo;
                            fsuser.apiSuccess = true;
                            //console.log("It worked " + fsuser.apiSuccess + " " + tries);
                            callback();
                        }
                    });
                },
                function(err) {
                    if(!fsuser.apiSuccess) {
                        logger.error("Efiport call failed 10 times", {flowid: req.flowid});
                        return callback("Could not fetch modules. Please login again.");
                    }
                    logger.info("Student data for " + fsuser.userid + "[" + fsuser.campusUsername + "] arrived", {flowid: req.flowid});
                    fsuser.matricularnr = fsuser.unparsedResponse.matrikelnummer;

                    logger.info('Parsing student data for ' + fsuser.userid, {flowid: req.flowid});
                    fsuser.modules = {};
                    fsuser.unparsedResponse.items.forEach(function (item) {
                        item.children.forEach(function (topLevelModule) {
                            if (topLevelModule.hasOwnProperty('children')) {
                                topLevelModule.children.forEach(function (module) {
                                    var curYear = new Date();
                                    curYear = curYear.getFullYear();
                                    if (curYear - module.year < 3) {
                                        var idBuffer = new Buffer(module.title);
                                        var hashedIdBuffer = crypto.createHash('sha1').update(idBuffer).digest('hex');
                                        fsuser.modules[module.title] = {
                                            'm_id': hashedIdBuffer,
                                            'm_name': module.title,
                                            'm_year': module.year,
                                            'm_effort_assignment': module.assignments,
                                            'm_effort_idependent': module.independenthours,
                                            'm_effort_contact': module.contacthours,
                                            'm_effort_total': module.workload
                                        };
                                    }
                                });
                            }
                        });
                    });
                    delete fsuser.unparsedResponse;
                    return callback(null, fsuser);
                }
            );/*
            logger.info("Student data for " + fsuser.userid + "[" + fsuser.campusUsername + "] arrived", {flowid: req.flowid});
            fsuser.matricularnr = fsuser.unparsedResponse.matrikelnummer;

            logger.info('Parsing student data for ' + fsuser.userid, {flowid: req.flowid});
            fsuser.modules = {};
            fsuser.unparsedResponse.items.forEach(function (item) {
                item.children.forEach(function (topLevelModule) {
                    if (topLevelModule.hasOwnProperty('children')) {
                        topLevelModule.children.forEach(function (module) {
                            var curYear = new Date();
                            curYear = curYear.getFullYear();
                            if (curYear - module.year < 3) {
                                var idBuffer = new Buffer(module.title);
                                var hashedIdBuffer = crypto.createHash('sha1').update(idBuffer).digest('hex');
                                fsuser.modules[module.title] = {
                                    'm_id': hashedIdBuffer,
                                    'm_name': module.title,
                                    'm_year': module.year,
                                    'm_effort_assignment': module.assignments,
                                    'm_effort_idependent': module.independenthours,
                                    'm_effort_contact': module.contacthours,
                                    'm_effort_total': module.workload
                                };
                            }
                        });
                    }
                });
            });
            delete fsuser.unparsedResponse;
            //console.log(fsuser);
            return callback(null, fsuser);
            process.exit(0);
            */
        },
        //TODO hier funktion für ident table
        function (fsuser, callback) {
            var identEntry = new identdb.identificationModel();
            identEntry.jsession = fsuser.token;
            identEntry.studentid = fsuser.userid;
            identEntry.save(function (err, result) {
                if (err) {
                    logger.error(err, {flowid: req.flowid});
                    return callback("Fucked UP!");
                } else {
                    logger.info("Created session for user " + fsuser.userid + " in database - " + fsuser.token, {flowid: req.flowid});
                    return callback(null, fsuser);
                }
            });
        },
        function (fsuser, callback) {
            //console.log("here #1");
            if (!fsuser.implicitSync) {
                logger.info("Student is already in sync. No new student will be added to database!", {flowid:req.flowid});
                return callback(null, fsuser);
            }
            //console.log(fsuser);
            var studentEntry = new studentdb.studentModel();
            studentEntry._id = fsuser.userid;
            studentEntry.matricularnr = fsuser.matricularnr;
            var module_ids = [];
            for (var module_item in fsuser.modules) {
                module_ids.push(fsuser.modules[module_item].m_id);
            }
            studentEntry.modules = module_ids;
            studentEntry.save(function (err, result) {
                if (err) {
                    console.log(err);
                    logger.error("Failed to save student " + fsuser.userid + "[" + fsuser.campusUsername + "]", {flowid: req.flowid});
                    return callback("Failed to save student " + fsuser.userid + "[" + fsuser.campusUsername + "]");
                } else {
                    fsuser.privacyFlag = result.privacyFlag;
                    return callback(null, fsuser);
                }
            });
            /*
             async.series([
             function(callback) {
             studentdb.studentModel.count({_id: fsuser.userid}, function(err, count) {
             if(count > 0) {
             logger.warn('Student + ' + fsuser.userid + ' already exists in database', {flowid: req.flowid});
             return callback("Student already exists");
             } else {
             return callback()
             }
             });
             },
             function (callback) {
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
             logger.error("Failed to save student " + userInfo.userid + "[" + userInfo.campusUsername + "]", {flowid: req.flowid});
             return callback("Failed to save student " + userInfo.userid + "[" + userInfo.campusUsername + "]");
             } else {
             userInfo.privacyFlag = result.privacyFlag;
             return callback(null, userInfo);
             }
             });
             }
             ], function(err, result) {
             if(err) {
             //console.log(err);
             return callback(null, userInfo);
             }
             else {
             logger.info("Added Student "  + userInfo.userid + "[" + userInfo.campusUsername + "]", {flowid: req.flowid});
             return callback(null, result);
             }
             });*/

        },
        function (fsuser, callback) {
            //console.log("Here #2")
            if (!fsuser.implicitSync) {
                logger.info("Student is already in sync. No new modules will be added to database!", {flowid:req.flowid});
                callback(null, fsuser);
            }
            async.each(fsuser.modules, function (moduleinfo, callback) {
                async.series([
                    function (callback) {
                        moduledb.moduleModel.count({_id: moduleinfo.m_id}, function (err, count) {
                            if (count > 0) {
                                return callback("Module already exists...");
                            } else {
                                return callback();
                            }
                        });
                    },
                    function (callback) {
                        var mod = new moduledb.moduleModel();
                        mod._id = moduleinfo.m_id;
                        mod.assignmentHours = moduleinfo.m_effort_assignment;
                        mod.contactHours = moduleinfo.m_effort_contact;
                        mod.independentHours = moduleinfo.m_effort_idependent;
                        mod.workloadHours = moduleinfo.m_effort_total;
                        mod.name = moduleinfo.m_name;
                        mod.save(function (err) {
                            if (err) {
                                return callback("Fucked UP!");
                            } else {
                                var res = {'worked': true, 'added_module': mod._id};
                                return callback(null, res);
                            }
                        });
                    }
                ], function (err, result) {
                    if (err) logger.warn(err, {flowid: req.flowid});
                    else if (result[1]['worked']) logger.info("Added Module " + result[1]['added_module'], {flowid: req.flowid});
                    return callback();
                });
            }, function (err, result) {
                if (err) {
                    logger.error(err);
                } else {
                    return callback(null, fsuser)
                }
            });

        }
    ], function (err, result) {
        if (err) {
            logger.error(err, {flowid: req.flowid});
            res.status(400).send(err);
        }
        /*
         if(err == "E0000") {
         logger.error("Wrong username or password", {flowid: req.flowid});
         res.status(403).send("Wrong Username or Password. Please try again.");
         }
         if(err == "E0001") {
         studentdb.studentModel.findOne({_id: result.userid}, function(err, student) {
         if(!student) {
         logger.error("Modules for user " + result.userid + " have not been synced yet.", {flowid: req.flowid});
         res.status(500).send("Modules have not been synced yet. Please login again and check the 'syncdata' button");
         }
         if(student) {
         result.privacy = student.privacyFlag;
         result.matricularnr = student.matricularnr;
         res.status(200).send(result);
         }
         });
         }
         if(err == "E0002")
         {
         logger.error("Efiport call failed. Response: " + result["message"], {flowid: req.flowid});
         res.status(500).send("Failed to fetch Modules. Please login again. If the error persists, contact you Systemadministrator");
         }
         if(err == "E0003") res.status(500).send("Failed validate login against efiport.");
        */
         if (result) {
             if (result.length > 1) result = result[1];
             delete result.modules;
             delete result.loginSession;
             res.status(200).send(result);
         }

    });
}

exports.logout = function (req, res) {
    //console.log(req);
    var session = req.headers['x-session'];
    logger.info("Received logout request for " + session.slice(0, 10) + "[...]")
    identdb.identificationModel.findOneAndRemove({jsession: session}, function(err, result){
        if(err) {
            logger.error("Database connection failed", {flowid: req.flowid});
            res.status(500).send("Database connection failed");
        }
        if(!result) {
            logger.error("Session " + session.slice(0, 10) + "[...] not found in database", {flowid: req.flowid})
            res.status(404).send("Session " + session.slice(0, 10) + "[...] not found in database");
        }
        if(result) {
            logger.info("User " + result.studentid + " successfully logged out", {flowid: req.flowid});
            return res.status(200).send('User ' + result.studentid + ' successfully logged out ');
        }
    });

}

