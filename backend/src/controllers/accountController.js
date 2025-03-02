const { getSession } = require('../utils/neo4j');

// ✅ Crear una cuenta
const createAccount = async (req, res) => {
  const session = getSession();
  try {
    const { accountNumber, accountType, balance, currency } = req.body;

    if (!accountNumber || !accountType || !balance || !currency) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const result = await session.run(
      `MERGE (a:Account {
        accountId: randomUUID(),
        accountNumber: $accountNumber,
        accountType: $accountType,
        balance: $balance,
        currency: $currency,
        createdAt: datetime()
      }) RETURN a`,
      { accountNumber, accountType, balance, currency }
    );

    const account = result.records[0]?.get('a')?.properties;
    res.status(201).json(account);
  } catch (error) {
    console.error('❌ Error en createAccount:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Obtener todas las cuentas
const getAllAccounts = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run('MATCH (a:Account) RETURN a');

    const accounts = result.records.map(record => record.get('a').properties);
    res.json(accounts);
  } catch (error) {
    console.error('❌ Error en getAllAccounts:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Obtener una cuenta por ID
const getAccountById = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;
    const result = await session.run('MATCH (a:Account {accountId: $id}) RETURN a', { id });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    const account = result.records[0].get('a').properties;
    res.json(account);
  } catch (error) {
    console.error('❌ Error en getAccountById:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Actualizar una cuenta
const updateAccount = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;
    const { balance, accountType } = req.body;

    if (!balance && !accountType) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    const result = await session.run(
      `MATCH (a:Account {accountId: $id})
       SET a.balance = COALESCE($balance, a.balance),
           a.accountType = COALESCE($accountType, a.accountType)
       RETURN a`,
      { id, balance, accountType }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    const account = result.records[0].get('a').properties;
    res.json(account);
  } catch (error) {
    console.error('❌ Error en updateAccount:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// ✅ Eliminar una cuenta
const deleteAccount = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;

    // Verificar si la cuenta existe antes de eliminarla
    const checkResult = await session.run('MATCH (a:Account {accountId: $id}) RETURN a', { id });

    if (checkResult.records.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    await session.run('MATCH (a:Account {accountId: $id}) DETACH DELETE a', { id });
    res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    console.error('❌ Error en deleteAccount:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

module.exports = {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount
};