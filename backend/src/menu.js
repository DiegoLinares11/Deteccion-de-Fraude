const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ================================================
// 1. Menú Principal  
// ================================================
const mainMenu = () => {
  console.log('\n=== MENÚ PRINCIPAL ===');
  console.log('1. Clientes (Customer)');
  console.log('2. Cuentas (Account)');
  console.log('3. Dispositivos (Device)');
  console.log('4. Ubicaciones (Location)');
  console.log('5. Sucursales (Branch)');
  console.log('6. Salir');
  
  rl.question('\nSeleccione una entidad (1-6): ', (option) => {
    switch(option) {
      case '1': entityMenu('customers'); break;
      case '2': entityMenu('accounts'); break;
      case '3': entityMenu('devices'); break;
      case '4': entityMenu('locations'); break;
      case '5': entityMenu('branches'); break;
      case '6': 
        console.log('👋 ¡Hasta luego!');
        rl.close();
        process.exit(0);
      default: 
        console.log('❌ Opción inválida');
        mainMenu();
    }
  });
};

// ================================================
// 2. Menú de Entidad (CRUD + Relaciones)
// ================================================
const entityMenu = (entity) => {
  console.log(`\n=== MENÚ DE ${entity.toUpperCase()} ===`);
  console.log('1. Crear');
  console.log('2. Listar todos');
  console.log('3. Buscar por ID');
  console.log('4. Actualizar');
  console.log('5. Eliminar');
  console.log('6. Gestionar relaciones');
  console.log('7. Volver al menú principal');
  
  rl.question('\nSeleccione una opción (1-7): ', async (option) => {
    switch(option) {
      case '1': await createEntity(entity); break;
      case '2': await listEntities(entity); break;
      case '3': await getEntityById(entity); break;
      case '4': await updateEntity(entity); break;
      case '5': await deleteEntity(entity); break;
      case '6': relationsMenu(entity); break;
      case '7': mainMenu(); break;
      default: 
        console.log('❌ Opción inválida');
        entityMenu(entity);
    }
  });
};

// ================================================
// 3. Menú de Relaciones (Específico por entidad)
// ================================================
const relationsMenu = (entity) => {
  const relations = getRelationsForEntity(entity);
  
  console.log(`\n=== RELACIONES PARA ${entity.toUpperCase()} ===`);
  relations.forEach((rel, index) => {
    console.log(`${index + 1}. ${rel.name} (${rel.description})`);
  });
  console.log(`${relations.length + 1}. Volver`);

  rl.question('\nSeleccione una relación: ', (option) => {
    const selected = relations[parseInt(option) - 1];
    if (selected) {
      relationCRUDMenu(selected);
    } else {
      entityMenu(entity);
    }
  });
};

// ================================================
// 4. Menú CRUD para Relaciones
// ================================================
const relationCRUDMenu = (relation) => {
  console.log(`\n=== GESTIÓN DE ${relation.name.toUpperCase()} ===`);
  console.log('1. Crear relación');
  console.log('2. Listar relaciones');
  console.log('3. Actualizar propiedad');
  console.log('4. Eliminar relación');
  console.log('5. Volver');
  
  rl.question('\nSeleccione una opción (1-5): ', async (option) => {
    switch(option) {
      case '1': await createRelation(relation); break;
      case '2': await listRelations(relation); break;
      case '3': await updateRelation(relation); break;
      case '4': await deleteRelation(relation); break;
      case '5': relationsMenu(relation.entity); break;
      default: 
        console.log('❌ Opción inválida');
        relationCRUDMenu(relation);
    }
  });
};

// ================================================
// Funciones de apoyo
// ================================================
const getRelationsForEntity = (entity) => {
  const relationsMap = {
    customers: [
      { 
        name: 'OWNS', 
        endpoint: 'owns',
        description: 'Cliente → Cuenta',
        entity: 'customers',
        params: ['customerId', 'accountNumber', 'since', 'sharePercentage']
      },
      {
        name: 'USES',
        endpoint: 'uses',
        description: 'Cliente → Dispositivo',
        entity: 'customers',
        params: ['customerId', 'deviceId', 'lastAccessed', 'ipAddress']
      }
    ],
    accounts: [
      {
        name: 'TRANSFER',
        endpoint: 'transfers',
        description: 'Cuenta → Cuenta',
        entity: 'accounts',
        params: ['sourceAccount', 'targetAccount', 'amount', 'currency']
      }
    ]
    // Agregar más relaciones según corresponda
  };
  return relationsMap[entity] || [];
};

// ================================================
// Funciones CRUD genéricas
// ================================================
const createEntity = async (entity) => {
  const questions = {
    customers: [
      { field: 'firstName', text: 'Nombre: ' },
      { field: 'lastName', text: 'Apellido: ' },
      { field: 'email', text: 'Email: ' }
    ],
    accounts: [
      { field: 'accountNumber', text: 'Número de cuenta: ' },
      { field: 'accountType', text: 'Tipo de cuenta (Savings/Checking/Corporate): ' },
      { field: 'balance', text: 'Balance: ' },
      { field: 'currency', text: 'Moneda (USD/EUR/GTQ): ' }
    ],
    devices: [
      { field: 'deviceId', text: 'ID del dispositivo: ' },
      { field: 'deviceType', text: 'Tipo de dispositivo (Mobile/Desktop/Tablet): ' },
      { field: 'os', text: 'Sistema operativo (Android/iOS/Windows): ' }
    ],
    locations: [
      { field: 'locationId', text: 'ID de la ubicación: ' },
      { field: 'address', text: 'Dirección: ' },
      { field: 'city', text: 'Ciudad: ' },
      { field: 'country', text: 'País: ' }
    ],
    branches: [
      { field: 'branchId', text: 'ID de la sucursal: ' },
      { field: 'name', text: 'Nombre: ' },
      { field: 'manager', text: 'Gerente: ' }
    ]
  };

  const inputs = {};
  for (const q of questions[entity]) {
    inputs[q.field] = await askQuestion(q.text);
  }

  try {
    const res = await axios.post(`http://localhost:3000/api/${entity}`, inputs);
    console.log('✅ Creado exitosamente:', res.data);
  } catch (err) {
    handleError(err);
  }
  entityMenu(entity);
};

// Función para listar relaciones (ejemplo)
const listRelations = async (relation) => {
  try {
    const res = await axios.get(`http://localhost:3000/api/relations/${relation.endpoint}`);
    console.log('\n🔗 Relaciones encontradas:');
    console.table(res.data);
  } catch (err) {
    handleError(err);
  }
  relationCRUDMenu(relation);
};

// Listar por entidades
const listEntities = async (entity) => {
  try {
    const res = await axios.get(`http://localhost:3000/api/${entity}`);
    console.log(`\n📄 ${entity.toUpperCase()} encontrados:`);
    console.table(res.data);
  } catch (err) {
    handleError(err);
  }
  entityMenu(entity);
};

// Listar entidades por ID
const getEntityById = async (entity) => {
  const idField = entity === 'customers' ? 'customerId' : 
                  entity === 'accounts' ? 'accountNumber' :
                  entity === 'devices' ? 'deviceId' :
                  entity === 'locations' ? 'locationId' :
                  entity === 'branches' ? 'branchId' : 'id';

  const id = await askQuestion(`Ingrese el ${idField}: `);

  try {
    const res = await axios.get(`http://localhost:3000/api/${entity}/${id}`);
    console.log('🔍 Resultado:', res.data);
  } catch (err) {
    handleError(err);
  }
  entityMenu(entity);
};

const updateEntity = async (entity) => {
  const idField = entity === 'customers' ? 'customerId' : 
                  entity === 'accounts' ? 'accountNumber' :
                  entity === 'devices' ? 'deviceId' :
                  entity === 'locations' ? 'locationId' :
                  entity === 'branches' ? 'branchId' : 'id';

  const questions = {
    customers: [
      { field: 'firstName', text: 'Nombre: ' },
      { field: 'lastName', text: 'Apellido: ' },
      { field: 'email', text: 'Email: ' },
      { field: 'highRisk', text: '¿Es de alto riesgo? (true/false): ' }
    ],
    accounts: [
      { field: 'accountNumber', text: 'Número de cuenta: ' },
      { field: 'accountType', text: 'Tipo de cuenta (Savings/Checking/Corporate): ' },
      { field: 'balance', text: 'Balance: ' },
      { field: 'currency', text: 'Moneda (USD/EUR/GTQ): ' }
    ],
    devices: [
      { field: 'deviceId', text: 'ID del dispositivo: ' },
      { field: 'deviceType', text: 'Tipo de dispositivo (Mobile/Desktop/Tablet): ' },
      { field: 'os', text: 'Sistema operativo (Android/iOS/Windows): ' }
    ],
    locations: [
      { field: 'locationId', text: 'ID de la ubicación: ' },
      { field: 'address', text: 'Dirección: ' },
      { field: 'city', text: 'Ciudad: ' },
      { field: 'country', text: 'País: ' }
    ],
    branches: [
      { field: 'branchId', text: 'ID de la sucursal: ' },
      { field: 'name', text: 'Nombre: ' },
      { field: 'manager', text: 'Gerente: ' }
    ]
  };

  const id = await askQuestion(`Ingrese el ${idField} a actualizar: `);
  const updates = {};

  for (const q of questions[entity]) {
    const answer = await askQuestion(`Nuevo valor para ${q.text} (dejar vacío para omitir): `);
    if (answer.trim()) updates[q.field] = q.field === 'highRisk' ? (answer.toLowerCase() === 'true') : answer;
  }

  try {
    const res = await axios.put(`http://localhost:3000/api/${entity}/${id}`, updates);
    console.log('✅ Actualizado:', res.data);
  } catch (err) {
    handleError(err);
  }
  entityMenu(entity);
};

// Eliminar entidades
const deleteEntity = async (entity) => {
  const idField = entity === 'customers' ? 'customerId' : 
                  entity === 'accounts' ? 'accountNumber' :
                  entity === 'devices' ? 'deviceId' :
                  entity === 'locations' ? 'locationId' :
                  entity === 'branches' ? 'branchId' : 'id';

  const id = await askQuestion(`Ingrese el ${idField} a eliminar: `);

  try {
    const res = await axios.delete(`http://localhost:3000/api/${entity}/${id}`);
    console.log('🗑️ Eliminado:', res.data.message);
  } catch (err) {
    handleError(err);
  }
  entityMenu(entity);
};





// ================================================
// Funciones auxiliares
// ================================================
const askQuestion = (question) => {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });
};

const handleError = (err) => {
  console.error('❌ Error:', err.response?.data?.error || err.message);
};

// Iniciar la aplicación
console.log('🟢 Sistema de Detección de Fraude - Neo4j');
mainMenu();