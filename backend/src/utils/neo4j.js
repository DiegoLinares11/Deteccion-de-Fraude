const neo4j = require('neo4j-driver');

// Make sure we're using the correct environment variable names
const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

// Add some validation to help debug connection issues
if (!uri) throw new Error('NEO4J_URI is not defined in environment variables');
if (!user) throw new Error('NEO4J_USER is not defined in environment variables');
if (!password) throw new Error('NEO4J_PASSWORD is not defined in environment variables');

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const verifyConnection = async () => {
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    console.log('✅ Conexión a Neo4j exitosa');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await session.close();
  }
};

verifyConnection();

const getSession = () => driver.session();
const closeDriver = async () => {
    await driver.close();
};

module.exports = {
    driver,
    getSession,
    closeDriver
};
