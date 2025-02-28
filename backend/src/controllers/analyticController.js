const { getSession } = require('../utils/neo4j');

// Función para detectar anillos de fraude (DEBE EXISTIR)
const getFraudRings = async (req, res) => {
  const session = getSession();
  try {
    // Ejemplo básico para probar
    const result = await session.run('MATCH (a:Account)-[t:transfers]->() RETURN a, t LIMIT 10');
    const data = result.records.map(record => ({
      account: record.get('a').properties,
      transfer: record.get('t').properties
    }));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener transacciones" });
  } finally {
    await session.close();
  }
};

// Exporta la función
module.exports = { getFraudRings };