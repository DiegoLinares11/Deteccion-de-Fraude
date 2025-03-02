const { getSession } = require('../../utils/neo4j');

// Crear relación OPERATES_AT: Account -> Branch
const createOperatesAtRelation = async (req, res) => {
  const session = getSession();
  try {
    const { accountNumber, branchCode, openHours } = req.body;

    // Verificar si Account y Branch existen
    const checkAccount = await session.run(
      'MATCH (a:Account {accountNumber: $accountNumber}) RETURN a',
      { accountNumber }
    );

    const checkBranch = await session.run(
      'MATCH (b:Branch {branchCode: $branchCode}) RETURN b',
      { branchCode }
    );

    if (checkAccount.records.length === 0) {
      return res.status(404).json({ error: "Account no encontrada" });
    }

    if (checkBranch.records.length === 0) {
      return res.status(404).json({ error: "Branch no encontrada" });
    }

    // Verificar si la relación ya existe
    const checkRelation = await session.run(
      `MATCH (a:Account {accountNumber: $accountNumber})-[r:operates_at]->(b:Branch {branchCode: $branchCode}) RETURN r`,
      { accountNumber, branchCode }
    );

    if (checkRelation.records.length > 0) {
      return res.status(400).json({ error: "La relación OPERATES_AT ya existe entre esta cuenta y sucursal" });
    }

    // Crear la relación OPERATES_AT
    const result = await session.run(
      `MATCH (a:Account {accountNumber: $accountNumber}), (b:Branch {branchCode: $branchCode})
       CREATE (a)-[r:operates_at {openHours: $openHours}]->(b)
       RETURN r`,
      { accountNumber, branchCode, openHours }
    );

    res.status(201).json(result.records[0].get('r').properties);
  } catch (error) {
    console.error("❌ Error en createOperatesAtRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// Obtener todas las relaciones OPERATES_AT
const getOperatesAtRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (a:Account)-[r:operates_at]->(b:Branch)
       RETURN b.branchCode AS branchCode, a.accountNumber AS accountNumber, r.openHours AS openHours`
    );

    const operatesAtRelations = result.records.map(record => ({
      branchCode: record.get('branchCode'),
      accountNumber: record.get('accountNumber'),
      openHours: record.get('openHours')
    }));

    res.json(operatesAtRelations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones OPERATES_AT" });
  } finally {
    await session.close();
  }
};

// Actualizar relación OPERATES_AT
const updateOperatesAtRelation = async (req, res) => {
  const session = getSession();
  try {
    const { accountNumber, branchCode, newOpenHours } = req.body;

    const result = await session.run(
      `MATCH (a:Account {accountNumber: $accountNumber})-[r:operates_at]->(b:Branch {branchCode: $branchCode})
       SET r.openHours = $newOpenHours
       RETURN r`,
      { accountNumber, branchCode, newOpenHours }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Relación OPERATES_AT no encontrada" });
    }

    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando relación OPERATES_AT" });
  } finally {
    await session.close();
  }
};

// Eliminar relación OPERATES_AT
const deleteOperatesAtRelation = async (req, res) => {
  const session = getSession();
  try {
    const { accountNumber, branchCode } = req.body;

    await session.run(
      `MATCH (a:Account {accountNumber: $accountNumber})-[r:operates_at]->(b:Branch {branchCode: $branchCode})
       DELETE r`
    );

    res.json({ message: "Relación OPERATES_AT eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando relación OPERATES_AT" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createOperatesAtRelation,
  getOperatesAtRelations,
  updateOperatesAtRelation,
  deleteOperatesAtRelation
};
