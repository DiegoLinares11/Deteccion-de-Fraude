const { getSession } = require('../../utils/neo4j');

// ✅ Agregar propiedades a una relación
const addPropertiesToRelation = async (req, res) => {
    const session = getSession();
    try {
        const { startLabel, startId, relType, endLabel, endId, properties } = req.body;

        if (!startLabel || !startId || !relType || !endLabel || !endId || !properties) {
            return res.status(400).json({ error: "Faltan parámetros requeridos" });
        }

        const setClause = Object.keys(properties)
            .map(key => `r.${key} = $${key}`)
            .join(', ');

        const result = await session.run(
            `MATCH (a:${startLabel} {customerId: $startId})-[r:${relType}]->(b:${endLabel} {customerId: $endId})
             SET ${setClause}
             RETURN r`,
            { startId, endId, ...properties }
        );

        if (result.records.length === 0) {
            return res.status(404).json({ error: "Relación no encontrada" });
        }

        res.json(result.records[0].get('r').properties);
    } catch (error) {
        console.error("❌ Error en addPropertiesToRelation:", error.message);
        res.status(500).json({ error: "Error al agregar propiedades a la relación" });
    } finally {
        await session.close();
    }
};

// ✅ Actualizar propiedades de una relación
const updatePropertiesInRelation = async (req, res) => {
    const session = getSession();
    try {
        const { startLabel, startId, relType, endLabel, endId, properties } = req.body;

        if (!startLabel || !startId || !relType || !endLabel || !endId || !properties) {
            return res.status(400).json({ error: "Faltan parámetros requeridos" });
        }

        const setClause = Object.keys(properties)
            .map(key => `r.${key} = $${key}`)
            .join(', ');

        const result = await session.run(
            `MATCH (a:${startLabel} {customerId: $startId})-[r:${relType}]->(b:${endLabel} {customerId: $endId})
             SET ${setClause}
             RETURN r`,
            { startId, endId, ...properties }
        );

        if (result.records.length === 0) {
            return res.status(404).json({ error: "Relación no encontrada" });
        }

        res.json(result.records[0].get('r').properties);
    } catch (error) {
        console.error("❌ Error en updatePropertiesInRelation:", error.message);
        res.status(500).json({ error: "Error al actualizar propiedades de la relación" });
    } finally {
        await session.close();
    }
};

// ✅ Eliminar propiedades específicas de una relación
const deletePropertiesFromRelation = async (req, res) => {
    const session = getSession();
    try {
        const { startLabel, startId, relType, endLabel, endId, properties } = req.body;

        if (!startLabel || !startId || !relType || !endLabel || !endId || !properties) {
            return res.status(400).json({ error: "Faltan parámetros requeridos" });
        }

        const removeClause = properties.map(prop => `r.${prop}`).join(', ');

        const result = await session.run(
            `MATCH (a:${startLabel} {customerId: $startId})-[r:${relType}]->(b:${endLabel} {customerId: $endId})
             REMOVE ${removeClause}
             RETURN r`,
            { startId, endId }
        );

        if (result.records.length === 0) {
            return res.status(404).json({ error: "Relación no encontrada" });
        }

        res.json(result.records[0].get('r').properties);
    } catch (error) {
        console.error("❌ Error en deletePropertiesFromRelation:", error.message);
        res.status(500).json({ error: "Error al eliminar propiedades de la relación" });
    } finally {
        await session.close();
    }
};

// ✅ Eliminar todas las propiedades de múltiples relaciones
const clearAllPropertiesFromRelations = async (req, res) => {
    const session = getSession();
    try {
        const { startLabel, relType, endLabel } = req.body;

        if (!startLabel || !relType || !endLabel) {
            return res.status(400).json({ error: "Faltan parámetros requeridos" });
        }

        const result = await session.run(
            `MATCH (a:${startLabel})-[r:${relType}]->(b:${endLabel})
             SET r = {}
             RETURN r`
        );

        res.json({ message: "Todas las propiedades eliminadas de las relaciones" });
    } catch (error) {
        console.error("❌ Error en clearAllPropertiesFromRelations:", error.message);
        res.status(500).json({ error: "Error al eliminar propiedades de las relaciones" });
    } finally {
        await session.close();
    }
};

module.exports = {
    addPropertiesToRelation,
    updatePropertiesInRelation,
    deletePropertiesFromRelation,
    clearAllPropertiesFromRelations
};
