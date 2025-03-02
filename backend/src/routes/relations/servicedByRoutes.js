const express = require('express');
const router = express.Router();
const {
  createServicedByRelation,
  getServicedByRelations,
  updateServiceFeedback,
  deleteServicedByRelation
} = require('../../controllers/relations/servicedByController');

// CRUD para SERVICED_BY
router.post('/', createServicedByRelation);     // POST /api/relations/serviced-by
router.get('/', getServicedByRelations);       // GET /api/relations/serviced-by
router.put('/', updateServiceFeedback);        // PUT /api/relations/serviced-by
router.delete('/', deleteServicedByRelation);  // DELETE /api/relations/serviced-by

module.exports = router;