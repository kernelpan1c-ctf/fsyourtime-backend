var express = require('express');
var router = express.Router();

//Routes
var students = require('./students.js');
var modules = require('./modules.js');
var efforts = require('./efforts.js');
var efftypes = require('./efftypes.js');
var sample = require('./sample.js');
var login = require('./login.js');


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
 *
 * @apiExample Usage [example]
 *      curl -H "Content-Type: application/json" -X POST -d '{"username": <user>, "password": <pass>}' <api-url>/api/login
 *
 * @apiSuccess {String} id SessionID
 * @apiSuccess {Boolean} success True if login worked
 *
 */
router.post('/api/login', login.login);
router.post('/api/logout', login.logout);

router.get('/api/students/:id', students.checkStudent);
router.get('/sample/create', sample.createSampleData);
/**
 * @api {get} /modules Get all Modules available in Database
 * @apiName GetModules
 * @apiGroup Modules
 *
 * @apiSuccess {String} id ModuleID
 * @apiSuccess {String} name Module Name
 *
 */
router.get('/api/modules', modules.getAllModules);
router.get('/api/modules/:id', modules.getModuleById);
router.get('/api/modules/:name', modules.getModuleByName);
router.get('/api/efforts', efforts.getEffortsByStudent);
router.get('/api/efforts/:id', efforts.getEffortById);
router.get('/api/efforts/:moduleid', efforts.getEffortsByModule);
router.get('/api/efforts/:efftypeid', efforts.getEffortsByType);
router.get('/api/efforttypes/:efftypeid', efftypes.getTypeById);
router.get('/api/efforttypes/:efftypename', efftypes.getTypeByName);
router.get('/api/efforttypes', efftypes.getAllTypes);
//router.put('/api/changeMyPrivacy', students.changeMyPrivacy);
//ToDo: Change to REST Stil
router.post('/api/createEffort', efforts.createEffort);
router.put('/api/updateEffort:effortid', efforts.updateEffort);
router.delete('/api/deleteEffort:effortid', efforts.deleteEffort);
router.delete('/api/deleteAllMyEfforts', efforts.deleteAllMyEfforts);

router.post('/api/efforts/', efforts.createEffort);

module.exports = router;
