const express = require('express');
const analyticController = require('../controllers/analyticController');
const router = express.Router();
const { driver } = require('../utils/neo4j');

// Fraud Rings - Robust (with amount deduction)
router.get('/fraud-rings/robust', async (req, res) => {
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
        res.json(result.records.map(record => record.toObject()));
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({ error: 'Error al buscar anillos de fraude', details: error.message });
    }
});

// Fraud Rings - Simple
router.get('/fraud-rings/simple', async (req, res) => {
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
        res.json(result.records.map(record => record.toObject()));
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({ error: 'Error al buscar anillos de fraude', details: error.message });
    }
});

// Fraud Rings - Unique (no duplicates)
router.get('/fraud-rings/unique', async (req, res) => {
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
        res.json(result.records.map(record => record.toObject()));
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({ error: 'Error al buscar anillos de fraude', details: error.message });
    }
});

// Fraud Rings - Chronological
// Fraud Rings - Chronological
router.get('/fraud-rings/chronological', async (req, res) => {
    try {
        const session = driver.session();
        // Primero, revisamos si existen transferencias
        const debugResult = await session.run(`
            MATCH (c1:Customer)-[:owns]->(a1:Account)-[t:transfers]->(a2:Account)<-[:owns]-(c2:Customer)
            RETURN count(t) as transferCount
        `);
        console.log('Total transfers found:', debugResult.records[0].get('transferCount').toNumber());

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
        res.json(result.records.map(record => record.toObject()));
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({ error: 'Error al buscar anillos de fraude', details: error.message });
    }
});


module.exports = router;