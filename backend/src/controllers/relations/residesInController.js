const { getSession } = require('../../utils/neo4j');

// 1. Crear relación RESIDES_IN
const createResidesInRelation = async (req, res) => {
  const session = getSession();
  try {
    const { customerId, locationId, addressType, verificationStatus } = req.body;

    // Validar existencia de nodos
    const customerCheck = await session.run(
      'MATCH (c:Customer {customerId: $customerId}) RETURN c',
      { customerId }
    );

    const locationCheck = await session.run(
      'MATCH (l:Location {locationId: $locationId}) RETURN l',
      { locationId }
    );

    if (customerCheck.records.length === 0 || locationCheck.records.length === 0) {
      return res.status(404).json({ error: "Cliente o ubicación no encontrados" });
    }

    // Verificar relación existente
    const existingRelation = await session.run(
      `MATCH (c:Customer {customerId: $customerId})-[r:resides_in]->(l:Location {locationId: $locationId})
       RETURN r`,
      { customerId, locationId }
    );

    if (existingRelation.records.length > 0) {
      return res.status(400).json({ error: "La relación RESIDES_IN ya existe" });
    }

    // Crear relación
    const result = await session.run(
      `MATCH (c:Customer {customerId: $customerId}), (l:Location {locationId: $locationId})
       CREATE (c)-[r:resides_in]->(l)
       SET r.since = datetime(),
           r.addressType = $addressType,
           r.verificationStatus = $verificationStatus
       RETURN r`,
      { customerId, locationId, addressType, verificationStatus: JSON.parse(verificationStatus) }
    );

    res.status(201).json(result.records[0].get('r').properties);
  } catch (error) {
    console.error("❌ Error en createResidesInRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// 2. Obtener todas las relaciones RESIDES_IN
const getResidesInRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
        `MATCH (c:Customer)-[r:resides_in]->(l:Location)
        RETURN 
            c.customerId AS customer,
            l.locationId AS location,
            r.since AS since,
            r.addressType AS type,
            r.verificationStatus AS verified`
    );

    const relations = result.records.map(record => ({
      customer: record.get('customer'),
      location: record.get('location'),
      since: record.get('since'),
      addressType: record.get('type'),
      verified: record.get('verified')
    }));

    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones RESIDES_IN" });
  } finally {
    await session.close();
  }
};

// 3. Actualizar estatus de verificación
const updateResidesInVerification = async (req, res) => {
  const session = getSession();
  try {
    const { customerId, locationId, newVerificationStatus } = req.body;
    
    const result = await session.run(
      `MATCH (c:Customer {customerId: $customerId})-[r:resides_in]->(l:Location {locationId: $locationId})
       SET r.verificationStatus = $newVerificationStatus
       RETURN r`,
      { customerId, locationId, newVerificationStatus: JSON.parse(newVerificationStatus) }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Relación no encontrada" });
    }

    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando verificación" });
  } finally {
    await session.close();
  }
};

// 4. Eliminar relación
const deleteResidesInRelation = async (req, res) => {
  const session = getSession();
  try {
    const { customerId, locationId } = req.body;
    
    await session.run(
      `MATCH (c:Customer {customerId: $customerId})-[r:resides_in]->(l:Location {locationId: $locationId})
       DELETE r`,
      { customerId, locationId }
    );

    res.json({ message: "Relación RESIDES_IN eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando relación" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createResidesInRelation,
  getResidesInRelations,
  updateResidesInVerification,
  deleteResidesInRelation
};