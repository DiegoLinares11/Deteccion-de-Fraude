const { getSession } = require('../utils/neo4j');

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

module.exports = {
  createOwnsRelations,
  getOwnsRelations
};