/**
 * Created by Kevin on 10/29/15.
 */

var identification = require('../models/Identification');

function validate(req, res, next) {

    console.log("Validating request...");
    var accesstoken = req.headers['x-session'];
    var student = req.headers['x-key'];

    if(accesstoken && student) {
        identification.identificationModel.findOne({studentid: student}, {}, { sort: {'createdAt': -1}}, function(err, result) {
            if(err)
            {
                console.log(err);
                res.status(500).send("Oops. Something went wrong. Please try again.");
            } //handle error
            //console.log(result);
            //console.log(accesstoken);
            if(result) {
                console.log("Found user")
                if(result.jsession === accesstoken) {
                    console.log("User authorized.");
                    next();
                }
                else {
                    var truncToken = accesstoken.substring(0, 7);
                    var truncSession = result.jsession.substring(0, 7);
                    console.log("Something was wrong: " + truncSession + " <==> " + truncToken);
                    res.status(403).send("User not authorized");
                }
            } else {
                res.status(403).send("User not in authentication database");
            }
        });
    } else {
        console.log("Error dies das");
        res.status(403).send("Missing accesstoken or student ID");
    }
}

module.exports = validate;