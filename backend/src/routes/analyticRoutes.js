const express = require("express");
const analyticController = require("../controllers/analyticController");
const router = express.Router();
const { driver, getSession } = require("../utils/neo4j");
const axios = require("axios");

// Fraud Rings - Robust (with amount deduction)
router.get("/fraud-rings/robust", async (req, res) => {
  try {
    const session = driver.session();
    const result = await session.run(`
            MATCH (c1:Customer)-[:owns]->(a1:Account)-[t:transfers]->(a2:Account)<-[:owns]-(c2:Customer)
            WHERE c1 <> c2
            WITH c1, c2, collect(t) as transfers, sum(toFloat(t.amount)) as totalAmount
            WHERE size(transfers) >= 1
            RETURN c1.firstName + ' ' + c1.lastName as sourceCustomer,
                   c2.firstName + ' ' + c2.lastName as targetCustomer,
                   totalAmount,
                   size(transfers) as transactionCount
            ORDER BY totalAmount DESC
            LIMIT 10
        `);
    await session.close();
    res.json(result.records.map((record) => record.toObject()));
  } catch (error) {
    console.error("Error detallado:", error);
    res
      .status(500)
      .json({
        error: "Error al buscar anillos de fraude",
        details: error.message,
      });
  }
});

// Fraud Rings - Simple
router.get("/fraud-rings/simple", async (req, res) => {
  try {
    const session = driver.session();
    const result = await session.run(`
            MATCH (c1:Customer)-[:owns]->(a1:Account)-[t:transfers]->(a2:Account)<-[:owns]-(c2:Customer)
            WHERE c1 <> c2
            WITH c1, c2, count(t) as transfers
            WHERE transfers >= 1
            RETURN c1.firstName + ' ' + c1.lastName as sourceCustomer,
                   c2.firstName + ' ' + c2.lastName as targetCustomer,
                   transfers as transactionCount
            ORDER BY transfers DESC
            LIMIT 10
        `);
    await session.close();
    res.json(result.records.map((record) => record.toObject()));
  } catch (error) {
    console.error("Error detallado:", error);
    res
      .status(500)
      .json({
        error: "Error al buscar anillos de fraude",
        details: error.message,
      });
  }
});

// Fraud Rings - Unique (no duplicates)
router.get("/fraud-rings/unique", async (req, res) => {
  try {
    const session = driver.session();
    const result = await session.run(`
            MATCH (c1:Customer)-[:owns]->(a1:Account)-[t:transfers]->(a2:Account)<-[:owns]-(c2:Customer)
            WHERE id(c1) < id(c2)
            WITH c1, c2, collect(t) as transfers
            WHERE size(transfers) >= 1
            RETURN c1.firstName + ' ' + c1.lastName as customer1,
                   c2.firstName + ' ' + c2.lastName as customer2,
                   size(transfers) as transactionCount,
                   [t IN transfers | t.amount] as amounts
            ORDER BY transactionCount DESC
            LIMIT 10
        `);
    await session.close();
    res.json(result.records.map((record) => record.toObject()));
  } catch (error) {
    console.error("Error detallado:", error);
    res
      .status(500)
      .json({
        error: "Error al buscar anillos de fraude",
        details: error.message,
      });
  }
});

// Fraud Rings - Chronological
// Fraud Rings - Chronological
router.get("/fraud-rings/chronological", async (req, res) => {
  try {
    const session = driver.session();
    // Primero, revisamos si existen transferencias
    const debugResult = await session.run(`
            MATCH (c1:Customer)-[:owns]->(a1:Account)-[t:transfers]->(a2:Account)<-[:owns]-(c2:Customer)
            RETURN count(t) as transferCount
        `);
    console.log(
      "Total transfers found:",
      debugResult.records[0].get("transferCount").toNumber()
    );

    const result = await session.run(`
            MATCH (c1:Customer)-[:owns]->(a1:Account)-[t:transfers]->(a2:Account)<-[:owns]-(c2:Customer)
            WHERE c1 <> c2
            WITH c1, c2, collect(t) as transfers
            WHERE size(transfers) >= 1
            RETURN c1.firstName + ' ' + c1.lastName as sourceCustomer,
                   c2.firstName + ' ' + c2.lastName as targetCustomer,
                   size(transfers) as transactionCount,
                   [t IN transfers | t.amount] as amounts,
                   [t IN transfers | t.transactionDate] as timestamps
            ORDER BY transactionCount DESC
            LIMIT 10
        `);
    await session.close();
    res.json(result.records.map((record) => record.toObject()));
  } catch (error) {
    console.error("Error detallado:", error);
    res
      .status(500)
      .json({
        error: "Error al buscar anillos de fraude",
        details: error.message,
      });
  }
});

// Amount Outliers
router.get("/amount-outliers", async (req, res) => {
  try {
    const session = driver.session();
    const result = await session.run(`
            MATCH (c:Customer)-[:owns]->(a:Account)-[t:transfers]->(:Account)
            WITH c, collect(toFloat(t.amount)) AS amounts, avg(t.amount) AS avgAmount, stDev(t.amount) AS stdDev
            UNWIND amounts AS amount
            WITH c, avgAmount, stdDev, amount
            WHERE amount > avgAmount + 2 * stdDev OR amount < avgAmount - 2 * stdDev
            RETURN c.customerId AS customer, amount, avgAmount, stdDev
            ORDER BY abs(amount - avgAmount) DESC
            LIMIT 20
        `);
    await session.close();
    res.json(result.records.map((record) => record.toObject()));
  } catch (error) {
    console.error("Error in getAmountOutliers:", error);
    res
      .status(500)
      .json({
        error: "Error al buscar outliers por monto",
        details: error.message,
      });
  }
});

// Time Outliers
router.get("/time-outliers", async (req, res) => {
  try {
    const session = driver.session();
    const result = await session.run(`
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
        `);
    await session.close();
    res.json(result.records.map((record) => record.toObject()));
  } catch (error) {
    console.error("Error in getTimeOutliers:", error);
    res
      .status(500)
      .json({
        error: "Error al buscar outliers por tiempo",
        details: error.message,
      });
  }
});

// Cascade Transfer Chains
router.get("/cascade-chains", async (req, res) => {
  try {
    const session = driver.session();
    const result = await session.run(`
            MATCH path = (a:Account)-[:transfers*2..5]->(b:Account)
            WHERE a <> b
            WITH a, b, path, reduce(total = 0, rel IN relationships(path) | total + toFloat(rel.amount)) AS totalTransferred
            RETURN a.accountNumber AS startAccount, b.accountNumber AS endAccount, totalTransferred, length(path) AS hops, nodes(path) AS accounts
            ORDER BY totalTransferred DESC
            LIMIT 10
        `);
    await session.close();
    res.json(result.records.map((record) => record.toObject()));
  } catch (error) {
    console.error("Error detallado:", error);
    res
      .status(500)
      .json({
        error: "Error al buscar cadenas de transferencias",
        details: error.message,
      });
  }
});

// High Risk Customers
router.get("/high-risk-customers", async (req, res) => {
  try {
    const session = driver.session();
    const result = await session.run(`
            MATCH (c:Customer)
            WHERE c.isHighRisk = true OR c.isVIP = true
            RETURN c.customerId AS customer, c.firstName AS firstName, c.lastName AS lastName, c.email AS email
            LIMIT 20
        `);
    await session.close();
    res.json(result.records.map((record) => record.toObject()));
  } catch (error) {
    console.error("Error detallado:", error);
    res
      .status(500)
      .json({
        error: "Error al buscar clientes de alto riesgo",
        details: error.message,
      });
  }
});

// Anomalous Customers
router.get("/anomalous-customers", async (req, res) => {
  try {
    const session = driver.session();
    const result = await session.run(`
            MATCH (c:Customer)-[:owns]->(a:Account)-[t:transfers]->(:Account)
            WITH c, count(t) AS txCount, 
                 collect(toFloat(t.amount)) AS amounts,
                 sum(toFloat(t.amount)) AS totalAmount
            WITH c, txCount, amounts, totalAmount,
                 reduce(sum = 0.0, x IN amounts | sum + x) / size(amounts) AS avgAmount
            WITH c, txCount, totalAmount, avgAmount,
                 reduce(
                     variance = 0.0,
                     x IN amounts |
                     variance + (x - avgAmount) * (x - avgAmount)
                 ) / size(amounts) AS variance
            WHERE (txCount > 5 AND totalAmount > 5000) OR 
                  (sqrt(variance) > avgAmount * 0.5)
            RETURN 
                c.customerId AS customer,
                c.firstName + ' ' + c.lastName AS customerName,
                txCount AS numberOfTransactions,
                totalAmount,
                avgAmount,
                sqrt(variance) AS standardDeviation
            ORDER BY totalAmount DESC, standardDeviation DESC
            LIMIT 20
        `);
    await session.close();
    res.json(result.records.map((record) => record.toObject()));
  } catch (error) {
    console.error("Error detallado:", error);
    res
      .status(500)
      .json({
        error: "Error al buscar clientes anómalos",
        details: error.message,
      });
  }
});
// Endpoint para K-Means Clustering
router.get("/kmeans-clustering", async (req, res) => {
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

    // Convertir los registros a un array de objetos, forzando valores numéricos nativos
    const transactions = result.records.map((record) => ({
      amount: Number(record.get("amount")),
      hour: Number(record.get("hour"))
    }));

    // Llamar al servicio de machine learning
    const mlResponse = await axios.post(
      "http://localhost:8000/cluster",
      transactions
    );

    // Devolver los resultados del clustering
    res.json(mlResponse.data);
  } catch (error) {
    console.error("Error en clustering:", error.message);
    res.status(500).json({ error: "Error en clustering", details: error.message });
  }
});


module.exports = router;
