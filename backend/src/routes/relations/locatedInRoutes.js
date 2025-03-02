const express = require('express');
const router = express.Router();
const {
  createLocatedInRelation,
  getLocatedInRelations,
  updateGeoAccuracy,
  deleteLocatedInRelation
} = require('../../controllers/relations/locatedInController');

// CRUD para LOCATED_IN
router.post('/', createLocatedInRelation);    // POST /api/relations/located-in
router.get('/', getLocatedInRelations);      // GET /api/relations/located-in
router.put('/', updateGeoAccuracy);          // PUT /api/relations/located-in
router.delete('/', deleteLocatedInRelation); // DELETE /api/relations/located-in

module.exports = router;