const { getSession } = require('../../utils/neo4j');

// 1. Crear relación LOCATED_IN esta va de Branch a Location
const createLocatedInRelation = async (req, res) => {
  const session = getSession();
  try {
    const { branchCode, locationId, branchArea, geoAccuracy } = req.body;

    // Validar existencia de nodos
    const branchCheck = await session.run(
      'MATCH (b:Branch {branchCode: $branchCode}) RETURN b',
      { branchCode }
    );

    const locationCheck = await session.run(
      'MATCH (l:Location {locationId: $locationId}) RETURN l',
      { locationId }
    );

    if (branchCheck.records.length === 0 || locationCheck.records.length === 0) {
      return res.status(404).json({ error: "Sucursal o ubicación no encontradas" });
    }

    // Verificar si la relación existe
    const existingRelation = await session.run(
      `MATCH (b:Branch {branchCode: $branchCode})-[r:located_in]->(l:Location {locationId: $locationId})
       RETURN r`,
      { branchCode, locationId }
    );

    if (existingRelation.records.length > 0) {
      return res.status(400).json({ error: "La relación LOCATED_IN ya existe" });
    }

    // Crear relación
    const result = await session.run(
      `MATCH (b:Branch {branchCode: $branchCode}), (l:Location {locationId: $locationId})
       CREATE (b)-[r:located_in]->(l)
       SET r.branchArea = $branchArea,
           r.geoAccuracy = $geoAccuracy,
           r.registeredAt = datetime()
       RETURN r`,
      { branchCode, locationId, branchArea, geoAccuracy: parseFloat(geoAccuracy) }
    );

    res.status(201).json(result.records[0].get('r').properties);
  } catch (error) {
    console.error("❌ Error en createLocatedInRelation:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await session.close();
  }
};

// 2. Obtener relaciones LOCATED_IN
const getLocatedInRelations = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (b:Branch)-[r:located_in]->(l:Location)
       RETURN 
         b.branchCode AS branch,
         l.locationId AS location,
         r.branchArea AS area,
         r.geoAccuracy AS accuracy,
         r.registeredAt AS registeredAt`
    );

    const relations = result.records.map(record => ({
      branch: record.get('branch'),
      location: record.get('location'),
      area: record.get('area'),
      accuracy: record.get('accuracy'),
      registeredAt: record.get('registeredAt')
    }));

    res.json(relations);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo relaciones LOCATED_IN" });
  } finally {
    await session.close();
  }
};

// 3. Actualizar precisión geográfica y área de la sucursal
const updateGeoAccuracy = async (req, res) => {
  const session = getSession();
  try {
    const { branchCode, locationId, newAccuracy, newBranchArea } = req.body;
    
    const result = await session.run(
      `MATCH (b:Branch {branchCode: $branchCode})-[r:located_in]->(l:Location {locationId: $locationId})
       SET r.geoAccuracy = $newAccuracy,
           r.branchArea = $newBranchArea
       RETURN r`,
      { branchCode, locationId, newAccuracy: parseFloat(newAccuracy), newBranchArea }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Relación no encontrada" });
    }

    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando precisión y área" });
  } finally {
    await session.close();
  }
};

// 4. Eliminar relación
const deleteLocatedInRelation = async (req, res) => {
  const session = getSession();
  try {
    const { branchCode, locationId } = req.body;
    
    await session.run(
      `MATCH (b:Branch {branchCode: $branchCode})-[r:located_in]->(l:Location {locationId: $locationId})
       DELETE r`,
      { branchCode, locationId }
    );

    res.json({ message: "Relación LOCATED_IN eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando relación" });
  } finally {
    await session.close();
  }
};

module.exports = {
  createLocatedInRelation,
  getLocatedInRelations,
  updateGeoAccuracy,
  deleteLocatedInRelation
};