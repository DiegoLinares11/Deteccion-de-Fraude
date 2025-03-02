const { getSession } = require('../../utils/neo4j');

// 1. Crear relación LINKED_TO
const createLinkedToRelation = async (req, res) => {
  const session = getSession();
  try {
    const { account1, account2, linkageType, confidenceScore } = req.body;

    // Validar existencia de cuentas
    const checkAccount1 = await session.run(
      'MATCH (a:Account {accountNumber: $account1}) RETURN a',
      { account1 }
    );

    const checkAccount2 = await session.run(
      'MATCH (a:Account {accountNumber: $account2}) RETURN a',
      { account2 }
    );

    if (checkAccount1.records.length === 0 || checkAccount2.records.length === 0) {
      return res.status(404).json({ error: "Una o ambas cuentas no existen" });
    }

    // Verificar si la relación ya existe
    const existingRelation = await session.run(
      `MATCH (a1:Account {accountNumber: $account1})-[r:linked_to]-(a2:Account {accountNumber: $account2})
       RETURN r`,
      { account1, account2 }
    );

    if (existingRelation.records.length > 0) {
      return res.status(400).json({ error: "La relación LINKED_TO ya existe" });
    }

    // Crear relación bidireccional
    const result = await session.run(
      `MATCH (a1:Account {accountNumber: $account1}), (a2:Account {accountNumber: $account2})
       CREATE (a1)-[r:linked_to]->(a2)
       SET r.linkageType = $linkageType,
           r.confidenceScore = $confidenceScore,
           r.detectedAt = datetime()
       RETURN r`,
      { account1, account2, linkageType, confidenceScore: parseFloat(confidenceScore) }
    );

    const relationship = result.records[0].get('r').properties;
    res.status(201).json(relationship);
  } catch (error) {
    console.error("❌ Error en createLinkedToRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// 2. Obtener todas las relaciones LINKED_TO
const getLinkedToRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (a1:Account)-[r:linked_to]->(a2:Account)
       RETURN 
         a1.accountNumber AS sourceAccount,
         a2.accountNumber AS targetAccount,
         r.linkageType AS type,
         r.confidenceScore AS score,
         r.detectedAt AS date`
    );

    const relations = result.records.map(record => ({
      source: record.get('sourceAccount'),
      target: record.get('targetAccount'),
      type: record.get('type'),
      score: record.get('score'),
      date: record.get('date')
    }));

    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones LINKED_TO" });
  } finally {
    await session.close();
  }
};

// 3. Actualizar propiedad de LINKED_TO
const updateLinkedToRelation = async (req, res) => {
  const session = getSession();
  try {
    const { account1, account2, newConfidenceScore } = req.body;
    
    const result = await session.run(
      `MATCH (a1:Account {accountNumber: $account1})-[r:linked_to]->(a2:Account {accountNumber: $account2})
       SET r.confidenceScore = $newConfidenceScore
       RETURN r`,
      { account1, account2, newConfidenceScore: parseFloat(newConfidenceScore) }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Relación no encontrada" });
    }

    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando LINKED_TO" });
  } finally {
    await session.close();
  }
};

// 4. Eliminar relación LINKED_TO
const deleteLinkedToRelation = async (req, res) => {
  const session = getSession();
  try {
    const { account1, account2 } = req.body;
    
    await session.run(
      `MATCH (a1:Account {accountNumber: $account1})-[r:linked_to]->(a2:Account {accountNumber: $account2})
       DELETE r`,
      { account1, account2 }
    );

    res.json({ message: "Relación linked_to eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando relación" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createLinkedToRelation,
  getLinkedToRelations,
  updateLinkedToRelation,
  deleteLinkedToRelation
};