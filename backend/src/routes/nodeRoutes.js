const express = require('express');
const nodeController  = require('../controllers/nodeController');
const router = express.Router();

router.post('/addProperties', nodeController.addPropertiesToNode);
router.put('/updateProperties', nodeController.updatePropertiesInNode);
router.delete('/deleteProperties', nodeController.deletePropertiesFromNode);


module.exports = router;