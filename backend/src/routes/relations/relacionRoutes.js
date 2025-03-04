const express = require('express');
const router = express.Router();
const {
  addPropertiesToRelation,
  updatePropertiesInRelation,
  deletePropertiesFromRelation,
  clearAllPropertiesFromRelations
} = require('../../controllers/relations/relacionController');

router.post('/addProperties', addPropertiesToRelation);    
router.put('/updateProperties', updatePropertiesInRelation);      
router.delete('/deleteProperties', deletePropertiesFromRelation);       
router.delete('/clearProperties', clearAllPropertiesFromRelations); 

module.exports = router;