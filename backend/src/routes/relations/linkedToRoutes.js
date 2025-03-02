const express = require('express');
const router = express.Router();
const {
  createLinkedToRelation,
  getLinkedToRelations,
  updateLinkedToRelation,
  deleteLinkedToRelation
} = require('../../controllers/relations/linkedToController');

// CRUD para LINKED_TO
router.post('/', createLinkedToRelation);    // POST /api/relations/linked-to
router.get('/', getLinkedToRelations);      // GET /api/relations/linked-to
router.put('/', updateLinkedToRelation);    // PUT /api/relations/linked-to
router.delete('/', deleteLinkedToRelation); // DELETE /api/relations/linked-to

module.exports = router;