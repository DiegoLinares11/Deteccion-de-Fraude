const express = require('express');
const router = express.Router();

// Importar subrutas
const ownsRoutes = require('./relations/ownRoutes');
const transferRoutes = require('./relations/transferRoutes');
const usesRoutes = require('./relations/useRoutes');
const locatedAtRoutes = require('./relations/locatedAtRoutes');
const operatedatRoutes = require('./relations/operatesAtRoutes');
const linkedToRoutes = require('./relations/linkedToRoutes');
const referredRoutes = require('./relations/referredRoutes');
const trustRoutes = require('./relations/trustRoutes');

// Asignar rutas base
router.use('/owns', ownsRoutes);          // /api/relations/owns
router.use('/transfers', transferRoutes); // /api/relations/transfers
router.use('/uses', usesRoutes);          // /api/relations/uses
router.use('/locatedat', locatedAtRoutes); // /api/relations/locatedat
router.use('/operateat', operatedatRoutes); // /api/relations/operates
router.use('/linkedto', linkedToRoutes); // /api/relations/linkedto
router.use('/referred', referredRoutes); // /api/relations/referred
router.use('/trusts', trustRoutes); // /api/relations/trusts

module.exports = router;