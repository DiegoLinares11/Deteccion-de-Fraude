const express = require('express');
const router = express.Router();
const {
  createResidesInRelation,
  getResidesInRelations,
  updateResidesInVerification,
  deleteResidesInRelation
} = require('../../controllers/relations/residesInController');

// CRUD para RESIDES_IN
router.post('/', createResidesInRelation);    // POST /api/relations/resides-in
router.get('/', getResidesInRelations);      // GET /api/relations/resides-in
router.put('/', updateResidesInVerification); // PUT /api/relations/resides-in
router.delete('/', deleteResidesInRelation);  // DELETE /api/relations/resides-in

module.exports = router;