/**
 * Created by Kevin on 10/12/15.
 */

var identdb = require('../models/Identification.js');
var studentdb = require('../models/Student.js');
var request = require('request');
var async = require('async');
var crypto = require('crypto');

exports.login = function (req, res) {
    //console.log(req);
    var user = req.body.username;
    var pass = req.body.password;
    res.setTimeout(5*60*1000);

    async.waterfall([
        function(callback) {
            console.log("Requesting login from " + user);
            request('https://cert-campus.frankfurt-school.de/clicnetclm/loginService.do?xaction=login&username='+user+'&password='+pass, function(err, response, body){
                var userInfo = JSON.parse(body);
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

            //require('request-debug')(request);
            var cookie = "JSESSIONID="+userinfo.sessionid;
            request({
                uri: 'https://cert-campus.frankfurt-school.de/clicnetclm/campusAppStudentX.do?xaction=getStudentData',
                headers: {
                    "Cookie": cookie
                }
            }, function(err, response, body) {
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
                    //var curYear = new Date();
                    //curYear = curYear.getFullYear();
                    if(topLevelModule.hasOwnProperty('children')) {
                        topLevelModule.children.forEach(function(module){
                            console.log(topLevelModule.title + " - " +module.title);
                            modules[module.title] = {'Category':topLevelModule.title, 'year':module.year, 'moduleid':module.id};
                        });

                    }
                    //console.log(module.year)
                })
                //console.log(item);
            });
            userinfo.modules = modules;
            res.send(JSON.stringify(userinfo, null, 3) + "\n");
            callback(null, userinfo);
        }
    ], function(err, result) {
        if(err) console.log(err);
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

