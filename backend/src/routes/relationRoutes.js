const express = require('express');
const router = express.Router();

// Importar subrutas
const ownsRoutes = require('./relations/ownRoutes');
const transferRoutes = require('./relations/transferRoutes');
const usesRoutes = require('./relations/useRoutes');

// Asignar rutas base
router.use('/owns', ownsRoutes);          // /api/relations/owns
router.use('/transfers', transferRoutes); // /api/relations/transfers
router.use('/uses', usesRoutes);          // /api/relations/uses

module.exports = router;