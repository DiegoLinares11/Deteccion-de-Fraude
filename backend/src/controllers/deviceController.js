const { getSession } = require('../utils/neo4j');

// Crear un dispositivo
const createDevice = async (req, res) => {
  const session = getSession();
  try {
    const { deviceId, deviceType, os, ipAddress } = req.body;

    if (!deviceId || !deviceType || !os || !ipAddress) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const result = await session.run(
      `MERGE (d:Device {
        deviceId: $deviceId,
        deviceType: $deviceType,
        os: $os,
        ipAddress: $ipAddress,
        createdAt: datetime()
      }) RETURN d`,
      { deviceId, deviceType, os, ipAddress }
    );

    const device = result.records[0]?.get('d')?.properties;
    res.status(201).json(device);
  } catch (error) {
    console.error('❌ Error en createDevice:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// Obtener todos los dispositivos
const getAllDevices = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run('MATCH (d:Device) RETURN d');

    const devices = result.records.map(record => record.get('d').properties);
    res.json(devices);
  } catch (error) {
    console.error('❌ Error en getAllDevices:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// Obtener un dispositivo por ID
const getDeviceById = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;
    const result = await session.run('MATCH (d:Device {deviceId: $id}) RETURN d', { id });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    const device = result.records[0].get('d').properties;
    res.json(device);
  } catch (error) {
    console.error('❌ Error en getDeviceById:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// Actualizar un dispositivo
const updateDevice = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;
    const { deviceType, os, ipAddress } = req.body;

    if (!deviceType && !os && !ipAddress) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    const result = await session.run(
      `MATCH (d:Device {deviceId: $id})
       SET d.deviceType = COALESCE($deviceType, d.deviceType),
           d.os = COALESCE($os, d.os),
           d.ipAddress = COALESCE($ipAddress, d.ipAddress)
       RETURN d`,
      { id, deviceType, os, ipAddress }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    const device = result.records[0].get('d').properties;
    res.json(device);
  } catch (error) {
    console.error('❌ Error en updateDevice:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// Eliminar un dispositivo
const deleteDevice = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;

    const checkResult = await session.run('MATCH (d:Device {deviceId: $id}) RETURN d', { id });

    if (checkResult.records.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    await session.run('MATCH (d:Device {deviceId: $id}) DETACH DELETE d', { id });
    res.json({ message: 'Dispositivo eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error en deleteDevice:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

module.exports = {
  createDevice,
  getAllDevices,
  getDeviceById,
  updateDevice,
  deleteDevice
};
