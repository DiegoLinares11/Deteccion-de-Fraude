const { getSession } = require('../../utils/neo4j');

// Crear relación TRANSFERS: Account -> Account
const createTransferRelation = async (req, res) => {
  const session = getSession();
  try {
    const { sourceAccount, targetAccount, amount, currency, isInternational } = req.body;

    // Verificar si las cuentas existen
    const checkSourceAccount = await session.run(
      'MATCH (a:Account {accountNumber: $sourceAccount}) RETURN a',
      { sourceAccount }
    );

    const checkTargetAccount = await session.run(
      'MATCH (a:Account {accountNumber: $targetAccount}) RETURN a',
      { targetAccount }
    );

    if (checkSourceAccount.records.length === 0) {
      return res.status(404).json({ error: "Cuenta de origen no encontrada" });
    }

    if (checkTargetAccount.records.length === 0) {
      return res.status(404).json({ error: "Cuenta de destino no encontrada" });
    }

    // Crear la relación TRANSFERS
    const result = await session.run(
      `MATCH (a1:Account {accountNumber: $sourceAccount}), (a2:Account {accountNumber: $targetAccount})
       CREATE (a1)-[r:transfers {
         amount: $amount,
         currency: $currency,
         transactionDate: datetime(),
         isInternational: $isInternational
       }]->(a2)
       RETURN r`,
      { sourceAccount, targetAccount, amount: parseFloat(amount), currency, isInternational: Boolean(isInternational) }
    );

    res.status(201).json(result.records[0].get('r').properties);
  } catch (error) {
    console.error("❌ Error en createTransferRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// Obtener todas las relaciones TRANSFERS
const getAllTransfers = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (a1:Account)-[r:transfers]->(a2:Account)
       RETURN a1.accountNumber AS sourceAccount, a2.accountNumber AS targetAccount, r.amount AS amount, r.currency AS currency, r.transactionDate AS transactionDate, r.isInternational AS isInternational`
    );

    const transfers = result.records.map(record => ({
      sourceAccount: record.get('sourceAccount'),
      targetAccount: record.get('targetAccount'),
      amount: record.get('amount'),
      currency: record.get('currency'),
      transactionDate: record.get('transactionDate'),
      isInternational: record.get('isInternational')
    }));

    res.json(transfers);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo transferencias" });
  } finally {
    await session.close();
  }
};

// Actualizar relación TRANSFERS
const updateTransferRelation = async (req, res) => {
  const session = getSession();
  try {
    const { sourceAccount, targetAccount, newAmount } = req.body;

    const result = await session.run(
      `MATCH (a1:Account {accountNumber: $sourceAccount})-[r:transfers]->(a2:Account {accountNumber: $targetAccount})
       SET r.amount = $newAmount
       RETURN r`,
      { sourceAccount, targetAccount, newAmount: parseFloat(newAmount) }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Relación TRANSFERS no encontrada" });
    }

    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando transferencia" });
  } finally {
    await session.close();
  }
};

// Eliminar relación TRANSFERS
const deleteTransferRelation = async (req, res) => {
  const session = getSession();
  try {
    const { sourceAccount, targetAccount } = req.body;

    await session.run(
      `MATCH (a1:Account {accountNumber: $sourceAccount})-[r:transfers]->(a2:Account {accountNumber: $targetAccount})
       DELETE r`
    );

    res.json({ message: "Relación TRANSFERS eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando transferencia" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createTransferRelation,
  getAllTransfers,
  updateTransferRelation,
  deleteTransferRelation
};
