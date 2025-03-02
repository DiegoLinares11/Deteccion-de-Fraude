const { getSession } = require('../../utils/neo4j');

// Crear relación CONNECTED_VIA: Account -> Device
const createConnectedViaRelation = async (req, res) => {
  const session = getSession();
  try {
    const { accountNumber, deviceId, lastUsed, frequency, isVerified } = req.body;

    // Verificar si Account y Device existen
    const checkAccount = await session.run(
      'MATCH (a:Account {accountNumber: $accountNumber}) RETURN a',
      { accountNumber }
    );

    const checkDevice = await session.run(
      'MATCH (d:Device {deviceId: $deviceId}) RETURN d',
      { deviceId }
    );

    if (checkAccount.records.length === 0) {
      return res.status(404).json({ error: "Account no encontrada" });
    }

    if (checkDevice.records.length === 0) {
      return res.status(404).json({ error: "Device no encontrado" });
    }

    // Verificar si la relación ya existe
    const checkRelation = await session.run(
      `MATCH (a:Account {accountNumber: $accountNumber})-[r:connected_via]->(d:Device {deviceId: $deviceId}) RETURN r`,
      { accountNumber, deviceId }
    );

    if (checkRelation.records.length > 0) {
      return res.status(400).json({ error: "La relación CONNECTED_VIA ya existe entre esta cuenta y dispositivo" });
    }

    // Crear la relación CONNECTED_VIA
    const result = await session.run(
      `MATCH (a:Account {accountNumber: $accountNumber}), (d:Device {deviceId: $deviceId})
       CREATE (a)-[r:connected_via {lastUsed: $lastUsed, frequency: $frequency, isVerified: $isVerified}]->(d)
       RETURN r`,
      { accountNumber, deviceId, lastUsed, frequency, isVerified }
    );

    res.status(201).json(result.records[0].get('r').properties);
  } catch (error) {
    console.error("❌ Error en createConnectedViaRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// Obtener todas las relaciones CONNECTED_VIA
const getConnectedViaRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (a:Account)-[r:connected_via]->(d:Device)
       RETURN a.accountNumber AS accountNumber, d.deviceId AS deviceId, r.lastUsed AS lastUsed, r.frequency AS frequency, r.isVerified AS isVerified`
    );

    const connectedViaRelations = result.records.map(record => ({
      accountNumber: record.get('accountNumber'),
      deviceId: record.get('deviceId'),
      lastUsed: record.get('lastUsed'),
      frequency: record.get('frequency'),
      isVerified: record.get('isVerified')
    }));

    res.json(connectedViaRelations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones CONNECTED_VIA" });
  } finally {
    await session.close();
  }
};

// Actualizar relación CONNECTED_VIA
const updateConnectedViaRelation = async (req, res) => {
  const session = getSession();
  try {
    const { accountNumber, deviceId, newFrequency, newIsVerified } = req.body;

    const result = await session.run(
      `MATCH (a:Account {accountNumber: $accountNumber})-[r:connected_via]->(d:Device {deviceId: $deviceId})
       SET r.frequency = $newFrequency, r.isVerified = $newIsVerified
       RETURN r`,
      { accountNumber, deviceId, newFrequency, newIsVerified }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Relación CONNECTED_VIA no encontrada" });
    }

    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando relación CONNECTED_VIA" });
  } finally {
    await session.close();
  }
};

// Eliminar relación CONNECTED_VIA
const deleteConnectedViaRelation = async (req, res) => {
  const session = getSession();
  try {
    const { accountNumber, deviceId } = req.body;

    await session.run(
      `MATCH (a:Account {accountNumber: $accountNumber})-[r:connected_via]->(d:Device {deviceId: $deviceId})
       DELETE r`
    );

    res.json({ message: "Relación CONNECTED_VIA eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando relación CONNECTED_VIA" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createConnectedViaRelation,
  getConnectedViaRelations,
  updateConnectedViaRelation,
  deleteConnectedViaRelation
};
