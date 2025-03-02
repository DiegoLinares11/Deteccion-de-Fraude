const express = require('express');
const router = express.Router();
const {
    createOperatesAtRelation,
    getOperatesAtRelations,
    updateOperatesAtRelation,
    deleteOperatesAtRelation
} = require('../../controllers/relations/operatesAtController');

// CRUD para OWNS
router.post('/', createOperatesAtRelation);       // POST /api/relations/operatedat
router.get('/', getOperatesAtRelations);       // GET /api/relations/operatedat
router.put('/', updateOperatesAtRelation);        // PUT /api/relations/operatedat
router.delete('/', deleteOperatesAtRelation);     // DELETE /api/relations/operatedat

module.exports = router;