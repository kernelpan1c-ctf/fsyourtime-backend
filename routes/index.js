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

router.post('/api/login', login.login);
router.post('/api/logout', login.logout);

router.get('/api/student/:id', students.checkStudent);
router.get('/sample/create', sample.createSampleData);
//router.get('/api/dummy', students.dummy);
//router.post('/api/clear', students.clear);
//router.get('/api/getMyInfo', students.getMyInfo);
router.get('/api/modules', modules.getMyModules);
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
