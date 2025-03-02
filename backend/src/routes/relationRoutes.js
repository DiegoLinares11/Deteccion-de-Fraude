const express = require('express');
const router = express.Router();
const {
  createOwnsRelations,
  getOwnsRelations
} = require('../controllers/relationsController');

router.post('/owns', createOwnsRelations);
router.get('/owns', getOwnsRelations);

module.exports = router;