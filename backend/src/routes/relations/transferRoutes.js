const express = require('express');
const router = express.Router();
const {
  createTransferRelation,
  getAllTransfers,
  updateTransferRelation,
  deleteTransferRelation,
} = require('../../controllers/relations/transfersController');

// CRUD para OWNS
router.post('/', createTransferRelation);       // POST /api/relations/owns
router.get('/', getAllTransfers);       // GET /api/relations/owns
router.put('/', updateTransferRelation);        // PUT /api/relations/owns
router.delete('/', deleteTransferRelation);     // DELETE /api/relations/owns

module.exports = router;