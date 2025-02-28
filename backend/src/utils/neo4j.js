const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

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
const closeDriver = async () => driver.close();

module.exports = { getSession, closeDriver };
