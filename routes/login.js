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
    res.setTimeout(20*60*1000);
    //res.setTimeout(5000);
    async.waterfall([
        function(callback) {
            require('request-debug')(request);
            console.log("Requesting login from " + user);
            request({
                'uri':'https://cert-campus.frankfurt-school.de/clicnetclm/loginService.do?xaction=login&username='+user + '&password=' + pass,
                'timeout':5000
            } , function(err, response, body) {
                try {
                    var userInfo = JSON.parse(body);
                } catch (e) {
                    var error = {'errormsg': e.message, 'ep_response':body};
                    res.status(500).send(JSON.stringify(error, null, 3));
                    callback(error);
                    return;
                }
                console.log('Did it work? ' + userInfo.success + " ["+ typeof(userInfo.success) + "]");
                if(userInfo.success == true) {
                    console.log('Down the waterfall #1');
                    //console.log("Session: " + identEntry.jsession);
                    callback(null, user, pass, userInfo);
                }
            });
        },
        function(user, pass, userinfo ,callback) {
            var sessionBuffer = new Buffer(user+pass+userinfo.sessionid);
            var hashedSessionBuffer = crypto.createHash('sha256').update(sessionBuffer).digest('hex').toUpperCase();

            console.log('New user created. SessionID: ' + hashedSessionBuffer);
            userinfo.mysessionid = hashedSessionBuffer;
            callback(null, userinfo);
        },
        function(userinfo, callback) {

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
                    console.log("Jesus christ I fucked up what the fucke is going on :O");
                    callback(err);
                }
                console.log('Student data arrived....');
                var studentinfo = JSON.parse(body);
                userinfo.matricularnr = studentinfo.matrikelnummer;
                //console.log("in final function\n" + JSON.stringify(userinfo));
                callback(null, userinfo, studentinfo);
            });
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
                            if(module.year == curYear) {
                                modules[module.title] = {
                                    'm_name':module.title,
                                    'm_category': topLevelModule.title,
                                    'm_year': module.year,
                                    'm_id': module.moduleid,
                                    'm_effort_assignment': module.assignments,
                                    'm_effort_idependent': module.independenthours,
                                    'm_effort_contact': module.contacthours
                                };
                            }
                        });
                    }
                    //console.log(module.year)
                })
                //console.log(item);
            });
            userinfo.modules = modules;
            res.send(JSON.stringify(userinfo, null, 3) + "\n");
            callback(null, userinfo);
        },
        function(userinfo, callback) {
            async.each(userinfo.modules, function(moduleinfo, callback) {
                //here goes calls to save all modules in the database...
                console.log(JSON.stringify(moduleinfo, null, 3));
                async.waterfall([
                    function(callback) {
                        moduledb.moduleModel.count({_id:moduleinfo.m_id}, function(err, count) {
                            if (count > 0) {
                                callback("Module already exists...");
                                return;
                            } else {
                                callback();
                            }
                        });
                    },
                    function(callback) {
                        var mod = new moduledb.moduleModel();
                        mod.assignmentHours = moduleinfo.m_effort_assignment;
                        mod.contactHours = moduleinfo.m_effort_contact;
                        mod.independentHours = moduleinfo.m_effort_idependent;
                        mod.name = moduleinfo.title;
                        mod._id = moduleinfo.m_id;
                        mod.save(function (err) {
                            if (err) {
                                console.log(err);
                                callback("Fucked UP!");
                                return;
                            } else {
                                var res = {'worked':true, 'added_module':mod._id};
                                callback(null, res);
                            }
                        });
                    }
                ], function(err, result) {
                    if(err) console.log(err);
                    else if(result['worked'] == true) console.log("Success! Added Module " + result['added_module']);
                    callback();
                });
            }, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    userinfo.modulesInDatabase = true;
                    //console.log(JSON.stringify(moduleinfo, null, 3));
                }
            });
            callback(null, userinfo)
        }
    ], function(err, result) {
        if(err) console.log(err);
        else console.log(JSON.stringify(result, null, 3));
    });
    /*
    var studentRequest = request.defaults({
        headers: {sessionid: identEntry.jsession}
    });

    console.log('Requesting student data with id: ' + identEntry.jsession);
    studentRequest('https://cert-campus.frankfurt-school.de/clicnetclm/campusAppStudentX.do?xaxtion=getStudentData', function(err, response, body) {
        console.log(body);
    });
    */
}

exports.logout = function (req, res) {
    return res.status(200).send('User successfully logged out');
}

