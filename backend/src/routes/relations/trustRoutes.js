const express = require('express');
const router = express.Router();
const {
    createTrustsRelation,
    getTrustsRelations,
    updateTrustsRelation,
    deleteTrustsRelation,
} = require('../../controllers/relations/trustsController');

// CRUD para OWNS
router.post('/', createTrustsRelation);       // POST /api/relations/trusts
router.get('/', getTrustsRelations);       // GET /api/relations/trusts
router.put('/', updateTrustsRelation);        // PUT /api/relations/trusts
router.delete('/', deleteTrustsRelation);     // DELETE /api/relations/trustss

module.exports = router;