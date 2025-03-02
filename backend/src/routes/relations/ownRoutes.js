const express = require('express');
const router = express.Router();
const {
    createOwnsRelations,
    getOwnsRelations,
    updateOwnsRelation,
    deleteOwnsRelation
} = require('../../controllers/relations/ownsController');

// CRUD para OWNS
router.post('/', createOwnsRelations);       // POST /api/relations/owns
router.get('/', getOwnsRelations);       // GET /api/relations/owns
router.put('/', updateOwnsRelation);        // PUT /api/relations/owns
router.delete('/', deleteOwnsRelation);     // DELETE /api/relations/owns

module.exports = router;