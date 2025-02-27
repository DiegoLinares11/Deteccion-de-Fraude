const express = require('express');
const router = express.Router();
const { session } = require('./db');

// Ruta para obtener todos los nodos
router.get('/customers', async (req, res) => {
  try {
    const result = await session.run('MATCH (c:Customer) RETURN c LIMIT 10');
    const customers = result.records.map(record => record.get('c').properties);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
