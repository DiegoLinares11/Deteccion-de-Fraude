const { getSession } = require('../../utils/neo4j');

// Crear relación TRUSTS: Customer -> Customer
const createTrustsRelation = async (req, res) => {
  const session = getSession();
  try {
    const { customerId1, customerId2, trustLevel, since } = req.body;

    // Verificar si ambos clientes existen
    const checkCustomer1 = await session.run(
      'MATCH (c:Customer {customerId: $customerId1}) RETURN c',
      { customerId1 }
    );

    const checkCustomer2 = await session.run(
      'MATCH (c:Customer {customerId: $customerId2}) RETURN c',
      { customerId2 }
    );

    if (checkCustomer1.records.length === 0) {
      return res.status(404).json({ error: "Customer 1 no encontrado" });
    }

    if (checkCustomer2.records.length === 0) {
      return res.status(404).json({ error: "Customer 2 no encontrado" });
    }

    // Verificar si la relación ya existe
    const checkRelation = await session.run(
      `MATCH (c1:Customer {customerId: $customerId1})-[r:trusts]->(c2:Customer {customerId: $customerId2}) RETURN r`,
      { customerId1, customerId2 }
    );

    if (checkRelation.records.length > 0) {
      return res.status(400).json({ error: "La relación TRUSTS ya existe entre estos clientes" });
    }

    // Crear la relación TRUSTS
    const result = await session.run(
      `MATCH (c1:Customer {customerId: $customerId1}), (c2:Customer {customerId: $customerId2})
       CREATE (c1)-[r:trusts {trustLevel: $trustLevel, since: $since}]->(c2)
       RETURN r`,
      { customerId1, customerId2, trustLevel, since }
    );

    res.status(201).json(result.records[0].get('r').properties);
  } catch (error) {
    console.error("❌ Error en createTrustsRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// Obtener todas las relaciones TRUSTS
const getTrustsRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c1:Customer)-[r:trusts]->(c2:Customer)
       RETURN c1.customerId AS customerId1, c2.customerId AS customerId2, r.trustLevel AS trustLevel, r.since AS since`
    );

    const trustsRelations = result.records.map(record => ({
      customerId1: record.get('customerId1'),
      customerId2: record.get('customerId2'),
      trustLevel: record.get('trustLevel'),
      since: record.get('since')
    }));

    res.json(trustsRelations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones TRUSTS" });
  } finally {
    await session.close();
  }
};

// Actualizar relación TRUSTS
const updateTrustsRelation = async (req, res) => {
    const session = getSession();
    try {
        const { customerId1, customerId2, newTrustLevel, newSince } = req.body;

        const result = await session.run(
            `MATCH (c1:Customer {customerId: $customerId1})-[r:trusts]->(c2:Customer {customerId: $customerId2})
             SET r.trustLevel = $newTrustLevel, r.since = $newSince
             RETURN r`,
            { customerId1, customerId2, newTrustLevel, newSince }
        );

        if (result.records.length === 0) {
            return res.status(404).json({ error: "Relación TRUSTS no encontrada" });
        }

        res.json(result.records[0].get('r').properties);
    } catch (error) {
        res.status(500).json({ error: "Error actualizando relación TRUSTS" });
    } finally {
        await session.close();
    }
};

// Eliminar relación TRUSTS
const deleteTrustsRelation = async (req, res) => {
  const session = getSession();
  try {
    const { customerId1, customerId2 } = req.body;

    await session.run(
      `MATCH (c1:Customer {customerId: $customerId1})-[r:trusts]->(c2:Customer {customerId: $customerId2})
       DELETE r`
    );

    res.json({ message: "Relación TRUSTS eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando relación TRUSTS" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createTrustsRelation,
  getTrustsRelations,
  updateTrustsRelation,
  deleteTrustsRelation
};
