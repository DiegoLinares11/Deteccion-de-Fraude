const { getSession } = require('../../utils/neo4j');

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

          // Verificar si la relación ya existe
      const checkRelation = await session.run(
        `MATCH (c:Customer {customerId: $customerId})-[r:owns]->(a:Account {accountNumber: $accountNumber}) RETURN r`,
        { customerId, accountNumber }
      );

      if (checkRelation.records.length > 0) {
        return res.status(400).json({ error: "La relación OWNS ya existe entre este cliente y cuenta" });
      }
  
      // Crear la relación OWNS
      const result = await session.run(
        `MATCH (c:Customer {customerId: $customerId}), (a:Account {accountNumber: $accountNumber})
         CREATE (c)-[r:OWNS]->(a)
          SET r.since = $since, r.sharePercentage = $sharePercentage`,
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
        `MATCH (c:Customer)-[r:owns]->(a:Account)
         RETURN c.firstName AS customerName, a.accountNumber AS accountNumber, r.since AS since, r.sharePercentage AS sharePercentage`
      );
  
      const relations = result.records.map(record => ({
        customerName: record.get('customerName'),
        accountNumber: record.get('accountNumber'),
        since: record.get('since'),
        sharePercentage: record.get('sharePercentage')
      }));
  
      res.json(relations);
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo relaciones OWNS" });
    } finally {
      await session.close();
    }
  };

  // UPDATE: Modificar propiedades de OWNS
const updateOwnsRelation = async (req, res) => {
    const session = getSession();
    try {
      const { customerId, accountNumber, newSharePercentage } = req.body;
      const result = await session.run(
        `MATCH (c:Customer {customerId: $customerId})-[r:owns]->(a:Account {accountNumber: $accountNumber})
         SET r.sharePercentage = $newSharePercentage
         RETURN c.firstName AS customerName, a.accountNumber AS accountNumber, r.since AS since, r.sharePercentage AS sharePercentage`,
        { customerId, accountNumber, newSharePercentage }
      );

      if (result.records.length === 0) {
        return res.status(404).json({ error: "Relación OWNS no encontrada" });
      }

      const updatedRelation = result.records[0].get('r').properties;
      res.json({
        customerName: result.records[0].get('customerName'),
        accountNumber: result.records[0].get('accountNumber'),
        since: result.records[0].get('since'),
        sharePercentage: updatedRelation.sharePercentage
      });
    } catch (error) {
      res.status(500).json({ error: "Error actualizando OWNS" });
    } finally {
      await session.close();
    }
  };
  
  // DELETE: Eliminar relación OWNS
const deleteOwnsRelation = async (req, res) => {
    const session = getSession();
    try {
      const { customerId, accountNumber } = req.body;
      await session.run(
        `MATCH (c:Customer {customerId: $customerId})-[r:owns]->(a:Account {accountNumber: $accountNumber})
         DELETE r`
      );
      res.json({ message: "Relación OWNS eliminada" });
    } catch (error) {
      res.status(500).json({ error: "Error eliminando OWNS" });
    } finally {
      await session.close();
    }
  };
  
  module.exports = {
    createOwnsRelations,
    getOwnsRelations,
    updateOwnsRelation,
    deleteOwnsRelation
  };