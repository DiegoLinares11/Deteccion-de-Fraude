// controllers/relations/referredController.js
const { getSession } = require('../../utils/neo4j');

// 1. Crear relación REFERRED
const createReferredRelation = async (req, res) => {
  const session = getSession();
  try {
    const { referrerId, referredId, referralCode, bonusAmount } = req.body;

    // Validar existencia de clientes
    const checkReferrer = await session.run(
      'MATCH (c:Customer {customerId: $referrerId}) RETURN c',
      { referrerId }
    );

    const checkReferred = await session.run(
      'MATCH (c:Customer {customerId: $referredId}) RETURN c',
      { referredId }
    );

    if (checkReferrer.records.length === 0 || checkReferred.records.length === 0) {
      return res.status(404).json({ error: "Uno o ambos clientes no existen" });
    }

    // Verificar si la relación ya existe
    const existingRelation = await session.run(
      `MATCH (c1:Customer {customerId: $referrerId})-[r:REFERRED]->(c2:Customer {customerId: $referredId})
       RETURN r`,
      { referrerId, referredId }
    );

    if (existingRelation.records.length > 0) {
      return res.status(400).json({ error: "La relación REFERRED ya existe" });
    }

    // Crear relación
    const result = await session.run(
      `MATCH (c1:Customer {customerId: $referrerId}), (c2:Customer {customerId: $referredId})
       CREATE (c1)-[r:REFERRED]->(c2)
       SET r.referralCode = $referralCode,
           r.referralDate = datetime(),
           r.bonusAmount = $bonusAmount
       RETURN r`,
      { referrerId, referredId, referralCode, bonusAmount: parseFloat(bonusAmount) }
    );

    const relationship = result.records[0].get('r').properties;
    res.status(201).json(relationship);
  } catch (error) {
    console.error("❌ Error en createReferredRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// 2. Obtener todas las relaciones REFERRED
const getReferredRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c1:Customer)-[r:REFERRED]->(c2:Customer)
       RETURN 
         c1.customerId AS referrer,
         c2.customerId AS referred,
         r.referralCode AS code,
         r.referralDate AS date,
         r.bonusAmount AS bonus`
    );

    const relations = result.records.map(record => ({
      referrer: record.get('referrer'),
      referred: record.get('referred'),
      code: record.get('code'),
      date: record.get('date'),
      bonus: record.get('bonus')
    }));

    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones REFERRED" });
  } finally {
    await session.close();
  }
};

// 3. Actualizar bono de referencia
const updateReferredBonus = async (req, res) => {
  const session = getSession();
  try {
    const { referrerId, referredId, newBonusAmount } = req.body;
    
    const result = await session.run(
      `MATCH (c1:Customer {customerId: $referrerId})-[r:REFERRED]->(c2:Customer {customerId: $referredId})
       SET r.bonusAmount = $newBonusAmount
       RETURN r`,
      { referrerId, referredId, newBonusAmount: parseFloat(newBonusAmount) }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Relación no encontrada" });
    }

    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando bono" });
  } finally {
    await session.close();
  }
};

// 4. Eliminar relación REFERRED
const deleteReferredRelation = async (req, res) => {
  const session = getSession();
  try {
    const { referrerId, referredId } = req.body;
    
    await session.run(
      `MATCH (c1:Customer {customerId: $referrerId})-[r:REFERRED]->(c2:Customer {customerId: $referredId})
       DELETE r`,
      { referrerId, referredId }
    );

    res.json({ message: "Relación REFERRED eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando relación" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createReferredRelation,
  getReferredRelations,
  updateReferredBonus,
  deleteReferredRelation
};