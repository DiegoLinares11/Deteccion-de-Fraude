const express = require('express');
const router = express.Router();
const {
  createOwnsRelations,
  getOwnsRelations
} = require('../controllers/relationsController');

// POST /api/relations/owns
router.post('/owns', createOwnsRelations);

// GET /api/relationships/owns
router.get('/owns', getOwnsRelations);

module.exports = router;