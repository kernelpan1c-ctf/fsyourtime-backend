var express = require('express');
var router = express.Router();

//Routes
var students = require('./students.js');
var modules = require('./modules.js');
var efforts = require('./efforts.js');
var efftypes = require('./efftypes.js');
var sample = require('./sample.js');


/*####### student ########*/
router.get('/', function(req, res, next) {
    res.send('you\'ve reached the index');
    next();
});

router.get('/api/checkStudent/:id', students.checkStudent);
router.get('/sample/create', sample.createSampleData);
//router.get('/api/dummy', students.dummy);
//router.post('/api/clear', students.clear);
router.get('/api/getMyInfo', students.getMyInfo);
router.get('/api/getMyModules', modules.getMyModules);
router.get('/api/getModuleById/:id', modules.getModuleById);
router.get('/api/getModuleByName/:name', modules.getModuleByName);
router.get('/api/getMyEfforts', efforts.getMyEfforts);
router.get('/api/getEffortById/:id', efforts.getEffortById);
router.get('/api/getEffortsByModule/:moduleid', efforts.getEffortsByModule);
router.get('/api/getEffortsByType/:efftypeid', efforts.getEffortsByType);
router.get('/api/getTypeById/:efftypeid', efftypes.getTypeById);
router.get('/api/getTypeByName/:efftypename', efftypes.getTypeByName);
router.get('/api/getAllTypes', efftypes.getAllTypes);

module.exports = router;