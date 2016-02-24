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
var conf = require('../config.js');
/**
 *
 * @param req
 * @param res
 *
 * This function combines various functions
 * 1. The user login is validated against the efiport API
 * 2. If the Login is successful, a new sessionkey is created and stored in the database.
 * 3. The database is queried to check whether the student already exists.
 * 4. If the Student exists, a flag is set and the following steps are skipped.
 * 5. The previous login is used to query the Efiport API for the Student data
 * 6. The student data is parsed and saved in the fsyourtime database
 * 7. The Answercode contains information if the login and sync was successful.
 * 8. If any of the previous steps fail, NO student is created in the fsyourtime database and the user has to login again
 *
 * The function combines numerous "waterfall" data structures. This is due to the asynchronous nature of Node.js
 * By using the waterfall structure, a synchronous dataflow can be achieved. The waterfall is part of the aysnc package.
 * For further information, please refer to the package's documentation
 *
 * Magic might be involved here.
 *
 */
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

            //The hashed username is used as userid in the fsyourtime database
            var hashedUserid = crypto.createHash('md5').update(userid).digest('hex').toUpperCase();
            fsuser.userid = hashedUserid;
            callback(null, fsuser);
        },
        function (fsuser, callback) {
            logger.info("Requesting login from " + user, {flowid: req.flowid});
            request({
                'uri': conf.loginUrl(user, pass),
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
                        fsuser.cookie = response.headers['set-cookie'][2].split(';')[0] + "; " + response.headers['set-cookie'][3].split(';')[0];
                        logger.info("Received Session: " + fsuser.loginSession);
                        return callback(null, fsuser);
                    } else {
                        return callback({code:403, message:"Wrong username or password"});
                    }
                } catch (e) {
                    return callback({code:500, message:"Failed to parse Efiport response."});
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
                if (err) return res.status(500).send("Something went wrong. Please try again!");
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
                    //var cookie = "JSESSIONID=" + fsuser.loginSession + "; SERVERID=fs-bl-02";
                    //console.log(cookie);
                    request({
                        uri: conf.studentInfoUrl,
                        headers: {
                            "Cookie": fsuser.cookie,
                            "apiKey": "d299ef13-a197-4c36-8948-e0112da3bdf2"
                        }
                    }, function (err, response, body) {
                        if (err) {
                            tries++;
                            setTimeout(callback(), 1000);
                        }
                        var studentInfo = JSON.parse(body);
                        if (!studentInfo.success) {
                            tries++;
                            setTimeout(callback(), 1000);
                        }
                        if (studentInfo.success) {
                            fsuser.unparsedResponse = studentInfo;
                            fsuser.apiSuccess = true;
                            callback();
                        }
                    });
                },
                function(err) {
                    if(!fsuser.apiSuccess) {
                        logger.error("Efiport call failed", {flowid: req.flowid});
                        return callback({code:500, message:"Could not fetch modules. Please login again."});
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
            );
        },
        function (fsuser, callback) {
            var identEntry = new identdb.identificationModel();
            identEntry.jsession = fsuser.token;
            identEntry.studentid = fsuser.userid;
            identEntry.save(function (err, result) {
                if (err) {
                    logger.error(err, {flowid: req.flowid});
                    return callback({code:500, message:"Failed to create new Session"});
                } else {
                    logger.info("Created session for user " + fsuser.userid + " in database - " + fsuser.token, {flowid: req.flowid});
                    return callback(null, fsuser);
                }
            });
        },
        function (fsuser, callback) {
            if (!fsuser.implicitSync) {
                logger.info("Student is already in sync. No new student will be added to database!", {flowid:req.flowid});
                return callback(null, fsuser);
            }

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
                    return callback({code:500, message:"Failed to save student " + fsuser.userid + "[" + fsuser.campusUsername + "]"});
                } else {
                    fsuser.privacyFlag = result.privacyFlag;
                    return callback(null, fsuser);
                }
            });
        },
        function (fsuser, callback) {
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
                                return callback({code:500, message:"Fucked UP!"});
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
            return res.status(err.code).send(err.message);
        }
        if (result) {
            if (result.length > 1) result = result[1];
            delete result.modules;
            delete result.loginSession;
            return res.status(200).send(result);
         }

    });
}

exports.logout = function (req, res) {
    var session = req.headers['x-session'];
    logger.info("Received logout request for " + session.slice(0, 10) + "[...]");
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

