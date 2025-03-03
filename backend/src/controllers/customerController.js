const { getSession } = require('../utils/neo4j');

// Crear un cliente
const createCustomer = async (req, res) => {
  const session = getSession();
  try {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const result = await session.run(
      `MERGE (c:Customer {
        customerId: randomUUID(),
        firstName: $firstName,
        lastName: $lastName,
        email: $email,
        createdAt: datetime()
      }) RETURN c`,
      { firstName, lastName, email }
    );

    const customer = result.records[0]?.get('c')?.properties;

    if (!customer) {
      return res.status(500).json({ error: 'Error al crear cliente' });
    }

    res.status(201).json(customer);
  } catch (error) {
    console.error('❌ Error en createCustomer:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// Obtener todos los clientes
const getAllCustomers = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run('MATCH (c:Customer) RETURN c');

    const customers = result.records.map(record => {
      const customer = record.get('c').properties;
      return {
        id: customer.customerId,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email
      };
    });

    res.json(customers);
  } catch (error) {
    console.error('❌ Error en getAllCustomers:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// Obtener un cliente por ID
const getCustomerById = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;

    const result = await session.run(
      'MATCH (c:Customer {customerId: $id}) RETURN c',
      { id }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const customer = result.records[0].get('c').properties;
    res.json(customer);
  } catch (error) {
    console.error('❌ Error en getCustomerById:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// Actualizar un cliente
const updateCustomer = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;
    const { firstName, lastName, email, highRisk } = req.body;

    if (!firstName && !lastName) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    const result = await session.run(
      `MATCH (c:Customer {customerId: $id})
       SET c.firstName = COALESCE($firstName, c.firstName),
           c.lastName = COALESCE($lastName, c.lastName),
           c.email = COALESCE($email, c.email),
           c.highRisk = COALESCE($highRisk, c.highRisk)
       RETURN c`,
      { id, firstName, lastName, email, highRisk }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const customer = result.records[0].get('c').properties;
    res.json(customer);
  } catch (error) {
    console.error('❌ Error en updateCustomer:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

// Eliminar un cliente
const deleteCustomer = async (req, res) => {
  const session = getSession();
  try {
    const { id } = req.params;

    // Verificar si el cliente existe antes de eliminarlo
    const checkResult = await session.run(
      'MATCH (c:Customer {customerId: $id}) RETURN c',
      { id }
    );

    if (checkResult.records.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await session.run(
      'MATCH (c:Customer {customerId: $id}) DETACH DELETE c',
      { id }
    );

    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('❌ Error en deleteCustomer:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await session.close();
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};
