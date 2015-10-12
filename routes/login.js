/**
 * Created by Kevin on 10/12/15.
 */

var identdb = require('../models/Identification.js');
var studentdb = require('../models/Student.js');

exports.login = function (req, res) {
    return res.status(200).send('User successfully logged in');
}

exports.logout = function (req, res) {
    return res.status(200).send('User successfully logged out');
}

