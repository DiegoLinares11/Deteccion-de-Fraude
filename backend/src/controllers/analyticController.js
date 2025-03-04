// controllers/analyticController.js
const { getSession } = require('../utils/neo4j');

const formatPath = (path) => {
  // path.segments es un arreglo de segmentos; cada segmento contiene start, rel y end.
  // Obtenemos los nodos en orden: se extrae el nodo "start" de cada segmento y luego se agrega el nodo final.
  const nodes = path.segments.reduce((acc, segment) => {
    acc.push(segment.start.properties);
    return acc;
  }, []);
  // Agregamos el nodo final (que en un ciclo coincide con el primero)
  nodes.push(path.end.properties);

  // Extraemos las relaciones de cada segmento
  const relations = path.segments.map(segment => segment.rel.properties);

  return { nodes, relations };
};

// 1. Consulta simple: Ciclos de 3 a 6 transfers sin restricciones adicionales
// 1. Ciclos simples (3..6) sin restricciones adicionales:
const getSimpleFraudRings = async (req, res) => {
  const session = getSession();
  try {
    const query = `
      MATCH path=(a:Account)-[:transfers*3..6]->(a)
      RETURN path
    `;
    const result = await session.run(query);
    const rings = result.records.map(record => record.get('path'));
    res.json({ count: rings.length, rings });
  } catch (error) {
    console.error("Error in getSimpleFraudRings:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.close();
  }
};

// 2. Ciclos sin nodos duplicados, salvo el de inicio/fin
const getUniqueFraudRings = async (req, res) => {
  const session = getSession();
  try {
    const query = `
      MATCH path=(a:Account)-[:transfers*3..6]->(a)
      WITH path, nodes(path) AS ns, head(nodes(path)) AS start
      WHERE size([n IN ns WHERE n = start]) = 2
        AND NONE(n IN ns WHERE n <> start AND size([m IN ns WHERE m = n]) > 1)
      RETURN path
    `;
    const result = await session.run(query);
    const rings = result.records.map(record => record.get('path'));
    res.json({ count: rings.length, rings });
  } catch (error) {
    console.error("Error in getUniqueFraudRings:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.close();
  }
};

// 3. Ciclos en orden cronológico (comparando transactionDate)
const getChronologicalFraudRings = async (req, res) => {
  const session = getSession();
  try {
    const query = `
      MATCH path=(a:Account)-[rel:transfers*3..6]->(a)
      WITH path, nodes(path) AS ns, rel, head(nodes(path)) AS start
      WHERE size([n IN ns WHERE n = start]) = 2
        AND NONE(n IN ns WHERE n <> start AND size([m IN ns WHERE m = n]) > 1)
        AND ALL(idx IN range(0, size(rel)-2)
                WHERE rel[idx].transactionDate < rel[idx+1].transactionDate)
      RETURN path
    `;
    const result = await session.run(query);
    const rings = result.records.map(record => record.get('path'));
    res.json({ count: rings.length, rings });
  } catch (error) {
    console.error("Error in getChronologicalFraudRings:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.close();
  }
};

// 4. Ciclos con deducción de monto (al menos 80% del anterior)
const getDeductionFraudRings = async (req, res) => {
  const session = getSession();
  try {
    const query = `
      MATCH path=(a:Account)-[rel:transfers*3..6]->(a)
      WITH path, nodes(path) AS ns, rel, head(nodes(path)) AS start
      WHERE size([n IN ns WHERE n = start]) = 2
        AND NONE(n IN ns WHERE n <> start AND size([m IN ns WHERE m = n]) > 1)
        AND ALL(idx IN range(0, size(rel)-2)
                WHERE rel[idx].transactionDate < rel[idx+1].transactionDate
                  AND rel[idx+1].amount >= rel[idx].amount * 0.8)
      RETURN path
    `;
    const result = await session.run(query);
    const rings = result.records.map(record => record.get('path'));
    res.json({ count: rings.length, rings });
  } catch (error) {
    console.error("Error in getDeductionFraudRings:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.close();
  }
};

// Definimos getFraudRings como alias a la consulta con deducción, que es la más robusta
const getFraudRings = getDeductionFraudRings;

module.exports = {
  getSimpleFraudRings,
  getUniqueFraudRings,
  getChronologicalFraudRings,
  getDeductionFraudRings,
  getFraudRings
};
