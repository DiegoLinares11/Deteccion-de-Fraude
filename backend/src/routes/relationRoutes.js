const express = require('express');
const router = express.Router();

// Importar subrutas
const ownsRoutes = require('./relations/ownRoutes');
const transferRoutes = require('./relations/transferRoutes');
const usesRoutes = require('./relations/useRoutes');
const locatedAtRoutes = require('./relations/locatedAtRoutes');

// Asignar rutas base
router.use('/owns', ownsRoutes);          // /api/relations/owns
router.use('/transfers', transferRoutes); // /api/relations/transfers
router.use('/uses', usesRoutes);          // /api/relations/uses
router.use('/locatedat', locatedAtRoutes); // /api/relations/locatedat

module.exports = router;