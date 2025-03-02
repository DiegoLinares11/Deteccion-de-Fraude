const { getSession } = require('../../utils/neo4j');

// Crear relación LOCATED_AT: Device -> Location
const createLocatedAtRelation = async (req, res) => {
  const session = getSession();
  try {
    const { deviceId, locationId, coordinates } = req.body;

    // Verificar si Device y Location existen
    const checkDevice = await session.run(
      'MATCH (d:Device {deviceId: $deviceId}) RETURN d',
      { deviceId }
    );

    const checkLocation = await session.run(
      'MATCH (l:Location {locationId: $locationId}) RETURN l',
      { locationId }
    );

    if (checkDevice.records.length === 0) {
      return res.status(404).json({ error: "Device no encontrado" });
    }

    if (checkLocation.records.length === 0) {
      return res.status(404).json({ error: "Location no encontrada" });
    }

    // Verificar si la relación ya existe
    const checkRelation = await session.run(
      `MATCH (d:Device {deviceId: $deviceId})-[r:located_at]->(l:Location {locationId: $locationId}) RETURN r`,
      { deviceId, locationId }
    );

    if (checkRelation.records.length > 0) {
      return res.status(400).json({ error: "La relación LOCATED_AT ya existe entre este dispositivo y ubicación" });
    }

    // Crear la relación LOCATED_AT
    const result = await session.run(
      `MATCH (d:Device {deviceId: $deviceId}), (l:Location {locationId: $locationId})
       CREATE (d)-[r:located_at {coordinates: $coordinates}]->(l)
       RETURN r`,
      { deviceId, locationId, coordinates }
    );

    res.status(201).json(result.records[0].get('r').properties);
  } catch (error) {
    console.error("❌ Error en createLocatedAtRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// Obtener todas las relaciones LOCATED_AT
const getLocatedAtRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (d:Device)-[r:located_at]->(l:Location)
       RETURN d.deviceId AS deviceId, l.locationId AS locationId, r.coordinates AS coordinates`
    );

    const locatedAtRelations = result.records.map(record => ({
      deviceId: record.get('deviceId'),
      locationId: record.get('locationId'),
      coordinates: record.get('coordinates')
    }));

    res.json(locatedAtRelations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones LOCATED_AT" });
  } finally {
    await session.close();
  }
};

// Actualizar relación LOCATED_AT
const updateLocatedAtRelation = async (req, res) => {
  const session = getSession();
  try {
    const { deviceId, locationId, newCoordinates } = req.body;

    const result = await session.run(
      `MATCH (d:Device {deviceId: $deviceId})-[r:located_at]->(l:Location {locationId: $locationId})
       SET r.coordinates = $newCoordinates
       RETURN r`,
      { deviceId, locationId, newCoordinates }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Relación LOCATED_AT no encontrada" });
    }

    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando relación LOCATED_AT" });
  } finally {
    await session.close();
  }
};

// Eliminar relación LOCATED_AT
const deleteLocatedAtRelation = async (req, res) => {
  const session = getSession();
  try {
    const { deviceId, locationId } = req.body;

    await session.run(
      `MATCH (d:Device {deviceId: $deviceId})-[r:located_at]->(l:Location {locationId: $locationId})
       DELETE r`
    );

    res.json({ message: "Relación LOCATED_AT eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando relación LOCATED_AT" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createLocatedAtRelation,
  getLocatedAtRelations,
  updateLocatedAtRelation,
  deleteLocatedAtRelation
};
