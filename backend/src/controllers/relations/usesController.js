const { getSession } = require('../../utils/neo4j');

// Crear relación USES: Customer -> Device
const createUsesRelation = async (req, res) => {
  const session = getSession();
  try {
    const { customerId, deviceId, lastAccessed, ipAddress } = req.body;

    // Verificar si Customer y Device existen
    const checkCustomer = await session.run(
      'MATCH (c:Customer {customerId: $customerId}) RETURN c',
      { customerId }
    );

    const checkDevice = await session.run(
      'MATCH (d:Device {deviceId: $deviceId}) RETURN d',
      { deviceId }
    );

    if (checkCustomer.records.length === 0) {
      return res.status(404).json({ error: "Customer no encontrado" });
    }

    if (checkDevice.records.length === 0) {
      return res.status(404).json({ error: "Device no encontrado" });
    }

    // Verificar si la relación ya existe
    const checkRelation = await session.run(
      `MATCH (c:Customer {customerId: $customerId})-[r:uses]->(d:Device {deviceId: $deviceId}) RETURN r`,
      { customerId, deviceId }
    );

    if (checkRelation.records.length > 0) {
      return res.status(400).json({ error: "La relación USES ya existe entre este cliente y dispositivo" });
    }

    // Crear la relación USES
    const result = await session.run(
      `MATCH (c:Customer {customerId: $customerId}), (d:Device {deviceId: $deviceId})
       CREATE (c)-[r:uses {lastAccessed: $lastAccessed, ipAddress: $ipAddress}]->(d)
       RETURN r`,
      { customerId, deviceId, lastAccessed, ipAddress }
    );

    res.status(201).json(result.records[0].get('r').properties);
  } catch (error) {
    console.error("❌ Error en createUsesRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// Obtener todas las relaciones USES
const getUsesRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c:Customer)-[r:uses]->(d:Device)
       RETURN c.customerId AS customerId, d.deviceId AS deviceId, r.lastAccessed AS lastAccessed, r.ipAddress AS ipAddress`
    );

    const usesRelations = result.records.map(record => ({
      customerId: record.get('customerId'),
      deviceId: record.get('deviceId'),
      lastAccessed: record.get('lastAccessed'),
      ipAddress: record.get('ipAddress')
    }));

    res.json(usesRelations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones USES" });
  } finally {
    await session.close();
  }
};

// Actualizar relación USES
const updateUsesRelation = async (req, res) => {
  const session = getSession();
  try {
    const { customerId, deviceId, newIpAddress } = req.body;

    const result = await session.run(
      `MATCH (c:Customer {customerId: $customerId})-[r:uses]->(d:Device {deviceId: $deviceId})
       SET r.ipAddress = $newIpAddress
       RETURN r`,
      { customerId, deviceId, newIpAddress }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Relación USES no encontrada" });
    }

    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando relación USES" });
  } finally {
    await session.close();
  }
};

// Eliminar relación USES
const deleteUsesRelation = async (req, res) => {
  const session = getSession();
  try {
    const { customerId, deviceId } = req.body;

    await session.run(
      `MATCH (c:Customer {customerId: $customerId})-[r:uses]->(d:Device {deviceId: $deviceId})
       DELETE r`
    );

    res.json({ message: "Relación USES eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando relación USES" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createUsesRelation,
  getUsesRelations,
  updateUsesRelation,
  deleteUsesRelation
};
