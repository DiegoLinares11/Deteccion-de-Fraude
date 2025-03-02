const { getSession } = require('../utils/neo4j');

// ✅ Crear una ubicación
const createLocation = async (req, res) => {
  const session = getSession();
  try {
    const { locationId, city, country, latitude, longitude } = req.body;

    if (!locationId || !city || !country || !latitude || !longitude) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const result = await session.run(
      `MERGE (l:Location {
        locationId: $locationId,
        city: $city,
        country: $country,
        latitude: $latitude,
        longitude: $longitude,
        createdAt: datetime()
      }) RETURN l`,
      { locationId, city, country, latitude, longitude }
    );

    const location = result.records[0]?.get('l')?.properties;
    res.status(201).json(location);
  } catch (error) {
    console.error('❌ Error en createLocation:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Obtener todas las ubicaciones
const getAllLocations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run('MATCH (l:Location) RETURN l');

    const locations = result.records.map(record => record.get('l').properties);
    res.json(locations);
  } catch (error) {
    console.error('❌ Error en getAllLocations:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Obtener una ubicación por ID
const getLocationById = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;
    const result = await session.run('MATCH (l:Location {locationId: $id}) RETURN l', { id });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    const location = result.records[0].get('l').properties;
    res.json(location);
  } catch (error) {
    console.error('❌ Error en getLocationById:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Actualizar una ubicación
const updateLocation = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;
    const { city, country, latitude, longitude } = req.body;

    if (!city && !country && !latitude && !longitude) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    const result = await session.run(
      `MATCH (l:Location {locationId: $id})
       SET l.city = COALESCE($city, l.city),
           l.country = COALESCE($country, l.country),
           l.latitude = COALESCE($latitude, l.latitude),
           l.longitude = COALESCE($longitude, l.longitude)
       RETURN l`,
      { id, city, country, latitude, longitude }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    const location = result.records[0].get('l').properties;
    res.json(location);
  } catch (error) {
    console.error('❌ Error en updateLocation:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Eliminar una ubicación
const deleteLocation = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;

    const checkResult = await session.run('MATCH (l:Location {locationId: $id}) RETURN l', { id });

    if (checkResult.records.length === 0) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    await session.run('MATCH (l:Location {locationId: $id}) DETACH DELETE l', { id });
    res.json({ message: 'Ubicación eliminada exitosamente' });
  } catch (error) {
    console.error('❌ Error en deleteLocation:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

module.exports = {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation
};
