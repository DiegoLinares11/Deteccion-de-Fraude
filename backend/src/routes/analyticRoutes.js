const express = require('express');
const analyticController = require('../controllers/analyticController');
const router = express.Router();

router.get('/fraud-rings', analyticController.getFraudRings);
//router.get('/high-risk-customers', analyticController.getHighRiskCustomers);

module.exports = router;