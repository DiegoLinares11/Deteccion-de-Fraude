const { getSession } = require('../../utils/neo4j');

// 1. Crear relación SERVICED_BY
const createServicedByRelation = async (req, res) => {
  const session = getSession();
  try {
    const { customerId, branchCode, serviceLevel, feedbackScore } = req.body;

    // Validar existencia de nodos
    const customerCheck = await session.run(
      'MATCH (c:Customer {customerId: $customerId}) RETURN c',
      { customerId }
    );

    const branchCheck = await session.run(
      'MATCH (b:Branch {branchCode: $branchCode}) RETURN b',
      { branchCode }
    );

    if (customerCheck.records.length === 0 || branchCheck.records.length === 0) {
      return res.status(404).json({ error: "Cliente o sucursal no encontrados" });
    }

    // Verificar relación existente
    const existingRelation = await session.run(
      `MATCH (c:Customer {customerId: $customerId})-[r:serviced_by]->(b:Branch {branchCode: $branchCode})
       RETURN r`,
      { customerId, branchCode }
    );

    if (existingRelation.records.length > 0) {
      return res.status(400).json({ error: "La relación SERVICED_BY ya existe" });
    }

    // Crear relación
    const result = await session.run(
      `MATCH (c:Customer {customerId: $customerId}), (b:Branch {branchCode: $branchCode})
       CREATE (c)-[r:serviced_by]->(b)
       SET r.serviceLevel = $serviceLevel,
           r.since = datetime(),
           r.feedbackScore = $feedbackScore
       RETURN r`,
      { customerId, branchCode, serviceLevel, feedbackScore: parseFloat(feedbackScore) }
    );

    res.status(201).json(result.records[0].get('r').properties);
  } catch (error) {
    console.error("❌ Error en createServicedByRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// 2. Obtener relaciones SERVICED_BY
const getServicedByRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c:Customer)-[r:serviced_by]->(b:Branch)
       RETURN 
         c.customerId AS customer,
         b.branchCode AS branch,
         r.serviceLevel AS level,
         r.since AS since,
         r.feedbackScore AS score`
    );

    const relations = result.records.map(record => ({
      customer: record.get('customer'),
      branch: record.get('branch'),
      serviceLevel: record.get('level'),
      since: record.get('since'),
      score: record.get('score')
    }));

    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones SERVICED_BY" });
  } finally {
    await session.close();
  }
};

// 3. Actualizar feedbackScore
const updateServiceFeedback = async (req, res) => {
  const session = getSession();
  try {
    const { customerId, branchCode, newScore } = req.body;
    
    const result = await session.run(
      `MATCH (c:Customer {customerId: $customerId})-[r:serviced_by]->(b:Branch {branchCode: $branchCode})
       SET r.feedbackScore = $newScore
       RETURN r`,
      { customerId, branchCode, newScore: parseFloat(newScore) }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Relación no encontrada" });
    }

    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando puntaje" });
  } finally {
    await session.close();
  }
};

// 4. Eliminar relación
const deleteServicedByRelation = async (req, res) => {
  const session = getSession();
  try {
    const { customerId, branchCode } = req.body;
    
    await session.run(
      `MATCH (c:Customer {customerId: $customerId})-[r:serviced_by]->(b:Branch {branchCode: $branchCode})
       DELETE r`,
      { customerId, branchCode }
    );

    res.json({ message: "Relación SERVICED_BY eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando relación" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createServicedByRelation,
  getServicedByRelations,
  updateServiceFeedback,
  deleteServicedByRelation
};