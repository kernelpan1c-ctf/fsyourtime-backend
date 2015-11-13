/**
 * Created by Kevin on 10/29/15.
 */

var identification = require('../models/Identification');
var logger = require('./logger').getLogger({'module': 'validator'});

function validate(req, res, next) {


    var accesstoken = req.headers['x-session'];
    var student = req.headers['x-key'];
    if(accesstoken && student) {
        logger.info("Validating request. User: " + student.slice(0, 10) + "[...]. Session " + accesstoken.slice(0, 10) + "[...]");
        identification.identificationModel.findOne({studentid: student}, {}, { sort: {'createdAt': -1}}, function(err, result) {
            if(err)
            {
                console.log(err);
                res.status(500).send("Oops. Something went wrong. Please try again.");
            }
            if(result) {
                if(result.jsession === accesstoken) {
                    logger.info("Found user " + student.slice(0, 10) + "[...]. Authorized");
                    next();
                }
                else {
                    logger.info("Validating request. Comparing sessions " + result.jsession.slice(0, 10) + "[...] <==> " + accesstoken.slice(0, 10) + "[...]");
                    res.status(403).send("User not authorized. Session mismatch");
                }
            } else {
                res.status(403).send("User not in authentication database");
            }
        });
    } else {
        if(!accesstoken) {
            logger.error('Missing Accesstoken');
        }
        if(!student) {
            logger.error('Missing Student ID')
        }
        res.status(403).send("Missing accesstoken or student ID");
    }
}

module.exports = validate;