require('dotenv').config();
const express = require('express');
const neo4j = require('neo4j-driver');

const app = express();
const port = process.env.PORT || 3000;

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

app.get('/test', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run('RETURN "Hello Neo4j" AS message');
    res.json({ message: result.records[0].get('message') });
  } finally {
    await session.close();
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
