const express = require('express');
const router = express.Router();
const {
    createUsesRelation,
    getUsesRelations,
    updateUsesRelation,
    deleteUsesRelation
} = require('../../controllers/relations/usesController');

// CRUD para OWNS
router.post('/', createUsesRelation);       // POST /api/relations/owns
router.get('/', getUsesRelations);       // GET /api/relations/owns
router.put('/', updateUsesRelation);        // PUT /api/relations/owns
router.delete('/', deleteUsesRelation);     // DELETE /api/relations/owns

module.exports = router;