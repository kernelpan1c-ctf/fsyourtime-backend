var express = require('express');
var router = express.Router();

//Routes
var students = require('./students.js');
var modules = require('./modules.js');


/*####### student ########*/
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.post('/api/checkStudent/:id', students.checkStudent);
router.post('/api/dummy', students.dummy);
router.post('/api/clear', students.clear);



module.exports = router;