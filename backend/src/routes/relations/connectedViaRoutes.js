const express = require('express');
const router = express.Router();
const {
    createConnectedViaRelation,
    getConnectedViaRelations,
    updateConnectedViaRelation,
    deleteConnectedViaRelation
} = require('../../controllers/relations/connectedViaController');

// CRUD para OWNS
router.post('/', createConnectedViaRelation);       // POST /api/relations/locatedat
router.get('/', getConnectedViaRelations);       // GET /api/relations/locatedat
router.put('/', updateConnectedViaRelation);        // PUT /api/relations/locatedat
router.delete('/', deleteConnectedViaRelation);     // DELETE /api/relations/locatedat

module.exports = router;