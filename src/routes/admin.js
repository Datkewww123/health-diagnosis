const Express = require('express');
const router = Express.Router();
const adminController = require('../controller/adminController');
const{isAdmin} = require('../middleware/isAdmin');
const{verifyToken} = require('../middleware/auth');


    //ham lay tat ca cac benh
    router.get('/all', verifyToken, isAdmin, adminController.getAllDiseases);
    router.get('/disease/:id', verifyToken, isAdmin, adminController.getDiseaseById);
    router.post('/disease', verifyToken, isAdmin, adminController.createDiseases);
    router.put('/disease/:id', verifyToken, isAdmin, adminController.updateDisease);
    router.delete('/disease/:id', verifyToken, isAdmin, adminController.deleteDisease);


module.exports = router;
