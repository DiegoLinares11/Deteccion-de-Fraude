const { getSession } = require('../utils/neo4j');

// ✅ Crear una sucursal
const createBranch = async (req, res) => {
  const session = getSession();
  try {
    const { branchCode, name, address, openHours, establishedYear, managerName } = req.body;

    if (!branchCode || !name || !address || !openHours || !establishedYear || !managerName) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const result = await session.run(
      `MERGE (b:Branch {
        branchId: randomUUID(),
        branchCode: $branchCode,
        name: $name,
        address: $address,
        openHours: $openHours,
        establishedYear: $establishedYear,
        managerName: $managerName,
        createdAt: datetime()
      }) RETURN b`,
      { branchCode, name, address, openHours, establishedYear, managerName }
    );

    const branch = result.records[0]?.get('b')?.properties;
    res.status(201).json(branch);
  } catch (error) {
    console.error('❌ Error en createBranch:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Obtener todas las sucursales
const getAllBranches = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run('MATCH (b:Branch) RETURN b');

    const branches = result.records.map(record => record.get('b').properties);
    res.json(branches);
  } catch (error) {
    console.error('❌ Error en getAllBranches:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Obtener una sucursal por ID
const getBranchById = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;
    const result = await session.run('MATCH (b:Branch {branchId: $id}) RETURN b', { id });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const branch = result.records[0].get('b').properties;
    res.json(branch);
  } catch (error) {
    console.error('❌ Error en getBranchById:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Actualizar una sucursal
const updateBranch = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;
    const { name, address, openHours, establishedYear, managerName } = req.body;

    if (!name && !address && !openHours && !establishedYear && !managerName) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    const result = await session.run(
      `MATCH (b:Branch {branchId: $id})
       SET b.name = COALESCE($name, b.name),
           b.address = COALESCE($address, b.address),
           b.openHours = COALESCE($openHours, b.openHours),
           b.establishedYear = COALESCE($establishedYear, b.establishedYear),
           b.managerName = COALESCE($managerName, b.managerName)
       RETURN b`,
      { id, name, address, openHours, establishedYear, managerName }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const branch = result.records[0].get('b').properties;
    res.json(branch);
  } catch (error) {
    console.error('❌ Error en updateBranch:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Eliminar una sucursal
const deleteBranch = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;

    const checkResult = await session.run('MATCH (b:Branch {branchId: $id}) RETURN b', { id });

    if (checkResult.records.length === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    await session.run('MATCH (b:Branch {branchId: $id}) DETACH DELETE b', { id });
    res.json({ message: 'Sucursal eliminada exitosamente' });
  } catch (error) {
    console.error('❌ Error en deleteBranch:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

module.exports = {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch
};
