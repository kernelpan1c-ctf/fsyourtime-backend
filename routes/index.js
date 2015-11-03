var express = require('express');
var router = express.Router();


//Routes
var students = require('./students.js');
var modules = require('./modules.js');
var efforts = require('./efforts.js');
var efftypes = require('./efftypes.js');
var sample = require('./sample.js');
var login = require('./auth.js');


/*####### student ########*/
router.get('/', function(req, res, next) {
    res.send('you\'ve reached the index');
    next();
});

router.get('/loaderio-e2fcf49d2f9e042b5ae0b63c35d9241e', function(req, res) {
    res.send('loaderio-e2fcf49d2f9e042b5ae0b63c35d9241e');
});
/**
 * @api {post} /login Login
 * @apiName Login
 * @apiGroup General
 *
 * @apiParam username FSCampus Username
 * @apiParam password FSCampus Password
 * @apiParam syncdata If "true", modules will be fetched from efiport
 *
 * @apiParamExample {json} Example
 *    {
 *      "username": "user",
 *      "password": "pass",
 *      "syncdata": true
 *    }
 *
 * @apiSuccess {String} id SessionID
 * @apiSuccess {Boolean} success True if login worked
 * @apiSuccess {Boolean} privacy True if the User has previously accepted privacy statement
 *
 */
router.post('/login', login.login);
router.post('/logout', login.logout);
router.get('/api/students/:id', students.checkStudent);
router.get('/sample/create', sample.createSampleData);
/**
 * @api {get} /api/modules/student/ Get all Modules available in Database
 * @apiName GetModules
 * @apiGroup Modules
 *
 * @apiSuccess {String} id ModuleID
 * @apiSuccess {String} name Module Name
 *
 */
router.get('/api/modules/student/:studentid', modules.getModulesByStudent);
router.get('/api/efforts/student/:studentid', efforts.getEffortsByStudent);
router.get('/api/efforts/:effortid', efforts.getEffortById);
/**
 * @api {get} /api/efforts/module/:moduleid/:studentid Get efforts by module and student
 * @apiName Get Efforts By Module
 * @apiGroup Efforts
 *
 * @apiSuccess {Boolean} success true, if module was saved
 * @apiSuccess {String} id ID if effort
 *
 * @apiParam {String} moduleid Module of the effort
 * @apiParam {String} studentid Creator of the effort
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "moduleid":"b7423cd5bee2b26c685d84d1ef5868174dfdefb2",
 *      "studentid":"1234567",
 *  }
 *
 */
router.get('/api/efforts/module/:moduleid/:studentid', efforts.getEffortsByModule);
router.get('/api/efforttypes/:efftypeid', efftypes.getTypeById);
router.get('/api/efforttypes/:efftypename', efftypes.getTypeByName);
router.get('/api/efforttypes', efftypes.getAllTypes);
//router.put('/api/changeMyPrivacy', students.changeMyPrivacy);
//ToDo: Change to REST Stil
/**
 * @api {post} /api/efforts Save new effort
 * @apiName Create Effort
 * @apiGroup Efforts
 *
 * @apiSuccess {Boolean} success true, if module was saved
 * @apiSuccess {String} id ID if effort
 *
 * @apiParam {Integer} amount Booked time in Minutes
 * @apiParam {String} moduleid Module for the effort
 * @apiParam {String} studentid Creator of the effort
 * @apiParam {String} efftypeid Type of the effort
 * @apiParam {String} performancedate Date on which the effort was done
 * @apiParam {String} [place] Place of the effort, empty if not set
 * @apiParam {String} [material] Material of the effort, empty if not set
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "amount":"20",
 *      "moduleid":"b7423cd5bee2b26c685d84d1ef5868174dfdefb2",
 *      "studentid":"1234567",
 *      "efforttypeid":"56257c4c1f7b6687091d2c06"
 *  }
 *
 */
router.post('/api/efforts', efforts.createEffort);
/**
 * @api {put} /api/updateEffort/:effortid Update existing effort
 * @apiName Update Effort
 * @apiGroup Efforts
 *
 * @apiSuccess {Boolean} success true, if module was saved
 * @apiSuccess {String} id ID if effort
 *
 * @apiParam {Integer} amount Booked time in Minutes
 * @apiParam {String} moduleid Module for the effort
 * @apiParam {String} studentid Creator of the effort
 * @apiParam {String} efftypeid Type of the effort
 * @apiParam {String} performancedate Date on which the effort was done
 * @apiParam {String} [place] Place of the effort, empty if not set
 * @apiParam {String} [material] Material of the effort, empty if not set
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *      "amount":"20",
 *      "moduleid":"b7423cd5bee2b26c685d84d1ef5868174dfdefb2",
 *      "studentid":"1234567",
 *      "efforttypeid":"56257c4c1f7b6687091d2c06"
 *  }
 *
 */
router.put('/api/updateEffort/:effortid', efforts.updateEffort);
//router.delete('/api/deleteEffort/:effortid', efforts.deleteEffort);
//router.delete('/api/eff', efforts.deleteAllMyEfforts);

module.exports = router;
