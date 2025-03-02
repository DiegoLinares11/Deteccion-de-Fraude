require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { closeDriver } = require('./utils/neo4j');
const customerRoutes = require('./routes/customerRoutes');
const analyticRoutes = require('./routes/analyticRoutes');
const accountRoutes = require('./routes/accountRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Ruta de verificación
app.get('/', (req, res) => {
  res.json({
    message: "API de Detección de Fraude en Neo4j",
    endpoints: {
      customers: "/api/customers",
      analytics: "/api/analytics/fraud-rings",
      accounts: "/api/accounts"
    }
  });
});

// Rutas principales
app.use('/api/customers', customerRoutes);
app.use('/api/analytics', analyticRoutes);
app.use('/api/accounts', accountRoutes);


// Manejador de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🟢 Servidor activo en http://localhost:${PORT}`);
});

// Cerrar conexión Neo4j al apagar el servidor
process.on('SIGINT', async () => {
  await closeDriver();
  process.exit(0);
});