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
const getAmountOutliers = async (req, res) => {
  const session = getSession();
  try {
    const query = `
      MATCH (c:Customer)-[:owns]->(a:Account)-[t:transfers]->(:Account)
      WITH c, collect(toFloat(t.amount)) AS amounts, avg(t.amount) AS avgAmount, stDev(t.amount) AS stdDev
      UNWIND amounts AS amount
      WITH c, avgAmount, stdDev, amount
      WHERE amount > avgAmount + 2 * stdDev OR amount < avgAmount - 2 * stdDev
      RETURN c.customerId AS customer, amount, avgAmount, stdDev
      ORDER BY abs(amount - avgAmount) DESC
      LIMIT 20
    `;
    const result = await session.run(query);
    await session.close();
    res.json(result.records.map(record => record.toObject()));
  } catch (error) {
    console.error('Error in getAmountOutliers:', error);
    res.status(500).json({ error: 'Error al buscar outliers por monto', details: error.message });
  }
};
const getTimeOutliers = async (req, res) => {
  const session = getSession();
  try {
    const query = `
      MATCH (c:Customer)-[:owns]->(a:Account)-[t:transfers]->(:Account)
      WITH c, t, 
           CASE 
              WHEN t.transactionDate CONTAINS 'T' 
              THEN datetime(t.transactionDate)
              ELSE datetime(replace(t.transactionDate, ' ', 'T'))
           END as dt
      WITH c, t, dt.hour as txHour
      WHERE txHour < 8 OR txHour > 20
      RETURN 
          c.customerId AS customer,
          c.firstName + ' ' + c.lastName AS customerName,
          t.amount AS amount,
          t.transactionDate AS date,
          txHour as hour
      ORDER BY toFloat(t.amount) DESC
      LIMIT 20
    `;
    const result = await session.run(query);
    await session.close();
    res.json(result.records.map(record => record.toObject()));
  } catch (error) {
    console.error("Error in getTimeOutliers:", error);
    res.status(500).json({ error: "Error al buscar outliers por tiempo", details: error.message });
  }
};

const getCascadeTransferChains = async (req, res) => {
  const session = getSession();
  try {
    const query = `
      MATCH path = (a:Account)-[:transfers*2..5]->(b:Account)
      WHERE a <> b
      WITH a, b, path, reduce(total = 0, rel IN relationships(path) | total + toFloat(rel.amount)) AS totalTransferred
      RETURN a.accountNumber AS startAccount, b.accountNumber AS endAccount, totalTransferred, length(path) AS hops, nodes(path) AS accounts
      ORDER BY totalTransferred DESC
      LIMIT 10
    `;
    const result = await session.run(query);
    const chains = result.records.map(record => record.toObject());
    res.json({ count: chains.length, chains });
  } catch (error) {
    console.error("Error in getCascadeTransferChains:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.close();
  }
};
const getHighRiskCustomers = async (req, res) => {
  const session = getSession();
  try {
    const query = `
      MATCH (c:Customer)
      WHERE c.isHighRisk = true OR c.isVIP = true
      RETURN c.customerId AS customer, c.firstName AS firstName, c.lastName AS lastName, c.email AS email
      LIMIT 20
    `;
    const result = await session.run(query);
    const customers = result.records.map(record => record.toObject());
    res.json({ count: customers.length, customers });
  } catch (error) {
    console.error("Error in getHighRiskCustomers:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.close();
  }
};
const getAnomalousCustomers = async (req, res) => {
  const session = getSession();
  try {
    const query = `
      MATCH (c:Customer)-[:owns]->(a:Account)-[t:transfers]->(:Account)
      WITH c, count(t) AS txCount, sum(toFloat(t.amount)) AS totalAmount
      WHERE txCount > 10 AND totalAmount > 10000
      RETURN c.customerId AS customer, c.firstName AS firstName, c.lastName AS lastName, txCount, totalAmount
      ORDER BY totalAmount DESC
      LIMIT 10
    `;
    const result = await session.run(query);
    const customers = result.records.map(record => record.toObject());
    res.json({ count: customers.length, customers });
  } catch (error) {
    console.error("Error in getAnomalousCustomers:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await session.close();
  }
};

const getKMeansClustering = async (req, res) => {
  const session = getSession();
  try {
    // Extraer datos de transacciones para clustering
    const result = await session.run(`
      MATCH (c:Customer)-[:owns]->(a:Account)-[t:transfers]->(:Account)
      WITH t,
           CASE 
             WHEN t.transactionDate CONTAINS 'T' 
             THEN datetime(t.transactionDate)
             ELSE datetime(replace(t.transactionDate, ' ', 'T'))
           END AS dt
      RETURN toFloat(t.amount) AS amount, 
             toInteger(dt.hour) AS hour,
             dt AS transactionDate
      LIMIT 100
    `);

    await session.close();

    // Convertir registros en un array simple de transacciones
    const transactions = result.records.map(record => ({
      amount: record.get("amount"),
      hour: record.get("hour"),
      transactionDate: record.get("transactionDate")
    }));

    // Retornamos directamente el array de transacciones
    res.json(transactions);
  } catch (error) {
    console.error("Error en getKMeansClustering:", error.message);
    res.status(500).json({ error: "Error en getKMeansClustering", details: error.message });
  }
};

module.exports = {  };

module.exports = {
  getSimpleFraudRings,
  getUniqueFraudRings,
  getChronologicalFraudRings,
  getDeductionFraudRings,
  getFraudRings,  // alias a getDeductionFraudRings
  getAmountOutliers,
  getTimeOutliers,
  getCascadeTransferChains,
  getHighRiskCustomers,
  getAnomalousCustomers,
  getKMeansClustering
};
