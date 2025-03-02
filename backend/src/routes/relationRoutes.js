const express = require('express');
const router = express.Router();
const {
  createOwnsRelations,
  getOwnsRelations,
  getAllTransfers
} = require('../controllers/relationsController');

router.post('/owns', createOwnsRelations);
router.get('/owns', getOwnsRelations);
router.get('/transfers', getAllTransfers);

module.exports = router;