const { getSession } = require('../utils/neo4j');

const addPropertiesToNode = async (req, res) => {
    const session = getSession();
    try {
        const { label, nodeId, properties } = req.body;

        if (!label || !nodeId || !properties) {
            return res.status(400).json({ error: "Debe proporcionar label, nodeId y properties" });
        }

        const setClause = Object.keys(properties).map(key => `n.${key} = $${key}`).join(', ');

        const result = await session.run(
            `MATCH (n:${label} {customerId: $nodeId}) SET ${setClause} RETURN n`,
            { nodeId, ...properties }
        );

        res.json(result.records[0].get('n').properties);
    } catch (error) {
        res.status(500).json({ error: "Error al agregar propiedades al nodo" });
    } finally {
        await session.close();
    }
};

const updatePropertiesInNode = async (req, res) => {
    const session = getSession();
    try {
        const { label, nodeId, properties } = req.body;

        if (!label || !nodeId || !properties) {
            return res.status(400).json({ error: "Debe proporcionar label, nodeId y properties" });
        }

        const setClause = Object.keys(properties).map(key => `n.${key} = $${key}`).join(', ');

        const result = await session.run(
            `MATCH (n:${label} {customerId: $nodeId}) SET ${setClause} RETURN n`,
            { nodeId, ...properties }
        );

        res.json(result.records[0].get('n').properties);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar propiedades del nodo" });
    } finally {
        await session.close();
    }
};

const deletePropertiesFromNode = async (req, res) => {
    const session = getSession();
    try {
        const { label, nodeId, properties } = req.body;

        if (!label || !nodeId || !properties || properties.length === 0) {
            return res.status(400).json({ error: "Debe proporcionar label, nodeId y un array de properties" });
        }

        const removeClause = properties.map(prop => `REMOVE n.${prop}`).join(' ');

        await session.run(
            `MATCH (n:${label} {customerId: $nodeId}) ${removeClause}`,
            { nodeId }
        );

        res.json({ message: "Propiedades eliminadas exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar propiedades del nodo" });
    } finally {
        await session.close();
    }
};

module.exports = {
    addPropertiesToNode,
    updatePropertiesInNode,
    deletePropertiesFromNode    
}