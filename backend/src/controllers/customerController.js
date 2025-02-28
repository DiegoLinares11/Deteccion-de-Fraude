const { getSession } = require('../utils/neo4j');

const createCustomer = async (req, res) => {
  const session = getSession();
  try {
    const { firstName, lastName, email } = req.body;
    const result = await session.run(
      `CREATE (c:Customer {
        customerId: randomUUID(),
        firstName: $firstName,
        lastName: $lastName,
        email: $email,
        createdAt: datetime()
      }) RETURN c`,
      { firstName, lastName, email }
    );
    const customer = result.records[0].get('c').properties;
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cliente' });
  } finally {
    await session.close();
  }
};

const getAllCustomers = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run('MATCH (c:Customer) RETURN c');
    
    // Verificar si hay resultados
    if (result.records.length === 0) {
      return res.status(404).json({ error: "No hay clientes registrados" });
    }

    // Mapear propiedades de los nodos
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
    console.error("Error en getAllCustomers:", error.message); // ¡Agrega esto para ver el error real!
    res.status(500).json({ error: 'Error al obtener clientes' });
  } finally {
    await session.close();
  }
};
  
 // 3. Obtener cliente por ID (FALTABA)
const getCustomerById = async (req, res) => {
    const session = getSession();
    try {
      const { id } = req.params;
      const result = await session.run(
        'MATCH (c:Customer {customerId: $id}) RETURN c',
        { id }
      );
      
      if (result.records.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }
      
      const customer = result.records[0].get('c').properties;
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Error al buscar cliente" });
    } finally {
      await session.close();
    }
};
  
  // 4. Actualizar cliente (FALTABA)
  const updateCustomer = async (req, res) => {
    const session = getSession();
    try {
      const { id } = req.params;
      const { firstName, lastName } = req.body;
      
      const result = await session.run(
        `MATCH (c:Customer {customerId: $id})
         SET c.firstName = $firstName, c.lastName = $lastName
         RETURN c`,
        { id, firstName, lastName }
      );
      
      // ... (manejo de respuesta)
    } catch (error) {
      // ... (manejo de errores)
    } finally {
      await session.close();
    }
  };
  
  // 5. Eliminar cliente (FALTABA)
  const deleteCustomer = async (req, res) => {
    const session = getSession();
    try {
      const { id } = req.params;
      await session.run(
        'MATCH (c:Customer {customerId: $id}) DELETE c',
        { id }
      );
      res.json({ message: "Cliente eliminado" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar cliente" });
    } finally {
      await session.close();
    }
  };
  
  // Exporta TODAS las funciones implementadas
  module.exports = { 
    createCustomer, 
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer 
  };