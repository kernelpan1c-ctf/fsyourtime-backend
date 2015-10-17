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
    //var userInfo = '';
    //var identEntry = '';

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
            var identEntry = new identdb.identificationModel();
            var sessionBuffer = new Buffer(user+pass+userinfo.sessionid);
            //console.log(sessionBuffer.toString());
            var hashedSessionBuffer = crypto.createHash('sha256').update(sessionBuffer).digest('hex');
            //console.log(hashedSessionBuffer.toUpperCase());
            identEntry.jsession = hashedSessionBuffer.toUpperCase();
            //console.log(identEntry.jsession);
            identEntry.save(function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('New user created. SessionID: ' + identEntry.jsession);
                    userinfo.mysessionid = identEntry.jsession;
                    callback(null, userinfo);
                }
            });
        },
        function(userinfo, callback) {

            console.log('Backend Session ID: ' + userinfo.mysessionid);
            console.log('Efiport Session ID: ' + userinfo.sessionid);
            console.log('Requesting Student Data...');
            /*
             var studentRequest = request.defaults({
             headers: {sessionid: userInfo.sessionid}
             });
             */
            //require('request-debug')(request);
            //var agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36";
            var cookie = "JSESSIONID="+userinfo.sessionid;
            request({
                uri: 'https://cert-campus.frankfurt-school.de/clicnetclm/campusAppStudentX.do?xaction=getStudentData',
                headers: {
                    //sessionid: userInfo.sessionid,
                    "Cookie": cookie
                }
            }, function(err, response, body) {
                console.log("I did it!!");
                var studentinfo = JSON.parse(body);
                userinfo.matricularnr = studentinfo.matrikelnummer;
                //console.log("in final function\n" + JSON.stringify(userinfo));
                callback(null, userinfo);
            });
        },
        function(result, callback) {
            //console.log(err);
            console.log("in final function\n" + JSON.stringify(result));
            return res.send(JSON.stringify(result));
        }
    ]);
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

