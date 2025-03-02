const express = require('express');
const router = express.Router();
const {
    createLocatedAtRelation,
    getLocatedAtRelations,
    updateLocatedAtRelation,
    deleteLocatedAtRelation
} = require('../../controllers/relations/locatedAtController');

// CRUD para OWNS
router.post('/', createLocatedAtRelation);       // POST /api/relations/locatedat
router.get('/', getLocatedAtRelations);       // GET /api/relations/locatedat
router.put('/', updateLocatedAtRelation);        // PUT /api/relations/locatedat
router.delete('/', deleteLocatedAtRelation);     // DELETE /api/relations/locatedat

module.exports = router;