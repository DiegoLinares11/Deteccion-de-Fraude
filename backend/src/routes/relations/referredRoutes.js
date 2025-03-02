const express = require('express');
const router = express.Router();
const {
  createReferredRelation,
  getReferredRelations,
  updateReferredBonus,
  deleteReferredRelation
} = require('../../controllers/relations/referredController');

// CRUD para REFERRED
router.post('/', createReferredRelation);    // POST /api/relations/referred
router.get('/', getReferredRelations);      // GET /api/relations/referred
router.put('/', updateReferredBonus);       // PUT /api/relations/referred
router.delete('/', deleteReferredRelation); // DELETE /api/relations/referred

module.exports = router;