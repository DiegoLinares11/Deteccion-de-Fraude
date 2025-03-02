const express = require('express');
const deviceController = require('../controllers/deviceController');
const router = express.Router();

router.post('/', deviceController.createDevice);
router.get('/', deviceController.getAllDevices);
router.get('/:id', deviceController.getDeviceById);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
