const { getSession } = require('../utils/neo4j');


//---- - - - Esto sera para crear relaciones - - - ----. 
//Customer -[OWNS]-> Account
const createOwnsRelations = async (req, res) => {
    const session = getSession();
    try {
      const { customerId, accountNumber, since, sharePercentage } = req.body;
  
      // Verificar si Customer y Account existen antes de crear la relación
      const checkCustomer = await session.run(
        'MATCH (c:Customer {customerId: $customerId}) RETURN c',
        { customerId }
      );
  
      const checkAccount = await session.run(
        'MATCH (a:Account {accountNumber: $accountNumber}) RETURN a',
        { accountNumber }
      );
  
      if (checkCustomer.records.length === 0) {
        return res.status(404).json({ error: "Customer no encontrado" });
      }
  
      if (checkAccount.records.length === 0) {
        return res.status(404).json({ error: "Account no encontrada" });
      }
  
      // Crear la relación OWNS
      const result = await session.run(
        `MATCH (c:Customer {customerId: $customerId}), (a:Account {accountNumber: $accountNumber})
         CREATE (c)-[r:OWNS {since: $since, sharePercentage: $sharePercentage}]->(a)
         RETURN r`,
        { customerId, accountNumber, since, sharePercentage }
      );
  
      if (result.records.length === 0) {
        return res.status(500).json({ error: "Error creando relación OWNS" });
      }
  
      const relationship = result.records[0].get('r').properties;
      res.status(201).json(relationship);
    } catch (error) {
      console.error("❌ Error en createOwnsRelations:", error.message);
      res.status(500).json({ error: "Error interno del servidor" });
    } finally {
      await session.close();
    }
  };

// 2. USES (Customer → Device)
const createUsesRelations = async (req, res) => {
    const session = getSession();
    try {
      const { customerId, deviceId, lastAccessed, ipAddress } = req.body;
  
      const result = await session.run(
        `MATCH (c:Customer {customerId: $customerId}), (d:Device {deviceId: $deviceId})
         CREATE (c)-[r:USES {lastAccessed: $lastAccessed, ipAddress: $ipAddress}]->(d)
         RETURN r`,
        { customerId, deviceId, lastAccessed: new Date(lastAccessed).toISOString(), ipAddress }
      );
  
      res.status(201).json(result.records[0].get('r').properties);
    } catch (error) {
      res.status(500).json({ error: "Error creando relación USES" });
    } finally {
      await session.close();
    }
  };
  
  // 3. TRANSFER (Account → Account)
  const createTransferRelations = async (req, res) => {
    const session = getSession();
    try {
      const { sourceAccount, targetAccount, amount, currency, isInternational } = req.body;
  
      const result = await session.run(
        `MATCH (a1:Account {accountNumber: $sourceAccount}), (a2:Account {accountNumber: $targetAccount})
         CREATE (a1)-[r:TRANSFER {
           amount: $amount,
           currency: $currency,
           transactionDate: datetime(),
           isInternational: $isInternational
         }]->(a2)
         RETURN r`,
        { sourceAccount, targetAccount, amount: parseFloat(amount), currency, isInternational: Boolean(isInternational) }
      );
  
      res.status(201).json(result.records[0].get('r').properties);
    } catch (error) {
      res.status(500).json({ error: "Error creando transferencia" });
    } finally {
      await session.close();
    }
  };

  // ------------------- Obtención de relaciones -------------------

// Obtener todas las relaciones de un tipo OWNS
const getOwnsRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c:Customer)-[r:owns]->(a:Account) RETURN r`
    );
    res.json(result.records.map(record => record.get('r').properties));
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones OWNS" });
  } finally {
    await session.close();
  }
};

// 2. Obtener todas las TRANSFER entre cuentas
const getAllTransfers = async (req, res) => {
    const session = getSession();
    try {
      const result = await session.run(`
        MATCH (a1)-[r:transfers]->(a2)
        RETURN 
          a1.accountNumber AS source,
          a2.accountNumber AS target,
          r.amount AS amount,
          r.currency AS currency,
          r.transactionDate AS date
      `);
  
      const transfers = result.records.map(record => ({
        source: record.get('source'),
        target: record.get('target'),
        amount: record.get('amount'),
        currency: record.get('currency'),
        date: record.get('date')
      }));
  
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo transferencias" });
    } finally {
      await session.close();
    }
  };


module.exports = {
  // Funciones de creación
  createOwnsRelations,
  createUsesRelations,
  createTransferRelations,

  // Funciones de obtención
  getOwnsRelations,
  getAllTransfers
};