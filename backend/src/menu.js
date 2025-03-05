const readline = require("readline");
const axios = require("axios");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ================================================
// 1. Menú Principal
// ================================================
const mainMenu = () => {
  console.log("\n=== MENÚ PRINCIPAL ===");
  console.log("1. Clientes (Customer)");
  console.log("2. Cuentas (Account)");
  console.log("3. Dispositivos (Device)");
  console.log("4. Ubicaciones (Location)");
  console.log("5. Sucursales (Branch)");
  console.log("6. Analítica (Detección de Fraude)");
  console.log("7.Salir ");

  rl.question("\nSeleccione una opción (1-7): ", (option) => {
    switch (option) {
      case "1":
        entityMenu("customers");
        break;
      case "2":
        entityMenu("accounts");
        break;
      case "3":
        entityMenu("devices");
        break;
      case "4":
        entityMenu("locations");
        break;
      case "5":
        entityMenu("branches");
        break;
      case "6":
        analyticMenu();
        break;
      case "7":
        console.log("👋 ¡Hasta luego!");
        rl.close();
        process.exit(0);
      default:
        console.log("❌ Opción inválida");
        mainMenu();
    }
  });
};

// ================================================
// 2. Menú de Entidad (CRUD + Relaciones)
// ================================================
const entityMenu = (entity) => {
  console.log(`\n=== MENÚ DE ${entity.toUpperCase()} ===`);
  console.log("1. Crear");
  console.log("2. Listar todos");
  console.log("3. Buscar por ID");
  console.log("4. Actualizar");
  console.log("5. Eliminar");
  console.log("6. Gestionar relaciones");
  console.log("7. Volver al menú principal");

  rl.question("\nSeleccione una opción (1-7): ", async (option) => {
    switch (option) {
      case "1":
        await createEntity(entity);
        break;
      case "2":
        await listEntities(entity);
        break;
      case "3":
        await getEntityById(entity);
        break;
      case "4":
        await updateEntity(entity);
        break;
      case "5":
        await deleteEntity(entity);
        break;
      case "6":
        relationsMenu(entity);
        break;
      case "7":
        mainMenu();
        break;
      default:
        console.log("❌ Opción inválida");
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

  rl.question("\nSeleccione una relación: ", (option) => {
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
  console.log("1. Crear relación");
  console.log("2. Listar relaciones");
  console.log("3. Actualizar propiedad");
  console.log("4. Eliminar relación");
  console.log("5. Volver");

  rl.question("\nSeleccione una opción (1-5): ", async (option) => {
    switch (option) {
      case "1":
        await createRelation(relation);
        break;
      case "2":
        await listRelations(relation);
        break;
      case "3":
        await updateRelation(relation);
        break;
      case "4":
        await deleteRelation(relation);
        break;
      case "5":
        relationsMenu(relation.entity);
        break;
      default:
        console.log("❌ Opción inválida");
        relationCRUDMenu(relation);
    }
  });
};

// ================================================
// 5. Menú de Analítica (Detección de Fraude)
// ================================================
const analyticMenu = () => {
  console.log("\n=== MENÚ DE ANALÍTICA ===");
  console.log("1. Fraud Rings - Robust (deducción de monto)");
  console.log("2. Fraud Rings - Simple");
  console.log("3. Fraud Rings - Único (sin duplicados)");
  console.log("4. Fraud Rings - Cronológico");
  console.log("5. Outliers por Monto");
  console.log("6. Outliers por Tiempo");
  console.log("7. Cadenas de Transferencias");
  console.log("8. Clientes de Alto Riesgo");
  console.log("9. Clientes Anómalos");
  console.log("10. Clusterización K-Means"); // NUEVA OPCIÓN
  console.log("11. Volver al menú principal");

  const availableFeatures = [
    { id: 1, name: "amount" },
    { id: 2, name: "hour" }
  ];

  rl.question("\nSeleccione una opción (1-11): ", async (option) => {
    try {
      let response;
      switch (option) {
        case "1":
          response = await axios.get(
            "http://localhost:3000/api/analytics/fraud-rings/robust"
          );
          console.table(response.data);
          break;
        case "2":
          response = await axios.get(
            "http://localhost:3000/api/analytics/fraud-rings/simple"
          );
          console.table(response.data);
          break;
        case "3":
          response = await axios.get(
            "http://localhost:3000/api/analytics/fraud-rings/unique"
          );
          console.table(response.data);
          break;
        case "4":
          response = await axios.get(
            "http://localhost:3000/api/analytics/fraud-rings/chronological"
          );
          console.table(response.data);
          break;
        case "5":
          response = await axios.get(
            "http://localhost:3000/api/analytics/amount-outliers"
          );
          console.table(response.data);
          break;
        case "6":
          response = await axios.get(
            "http://localhost:3000/api/analytics/time-outliers"
          );
          console.table(response.data);
          break;
        case "7":
          response = await axios.get(
            "http://localhost:3000/api/analytics/cascade-chains"
          );
          console.table(response.data);
          break;
        case "8":
          response = await axios.get(
            "http://localhost:3000/api/analytics/high-risk-customers"
          );
          console.table(response.data);
          break;
        case "9":
          response = await axios.get(
            "http://localhost:3000/api/analytics/anomalous-customers"
          );
          console.table(response.data);
          break;
          case '10':
          try {
            const response = await axios.get('http://localhost:3000/api/analytics/kmeans-clustering');
            const data = response.data;
            
            console.log(`\nTotal de transacciones procesadas: ${data.clusters.length}`);
            console.log(`Inercia: ${data.inertia}`);
            if(data.silhouette !== null){
              console.log(`Silhouette Score: ${data.silhouette}`);
            }
            
            console.log('\nResumen de Clusters:');
            console.table(data.cluster_summary);
            
            console.log('\nOutliers por Cluster:');
            Object.entries(data.outliers).forEach(([cluster, outliers]) => {
              console.log(`Cluster ${cluster}: ${outliers.length} outliers`);
            });
          } catch (error) {
            console.log('❌ Error en la consulta de analítica:', error.message);
          }
          analyticMenu();
          break;
        

        case "11":
          mainMenu();
          return;
        default:
          console.log("❌ Opción inválida");
      }

      if (response && response.data.length === 0) {
        console.log(
          "⚠️ No se encontraron resultados. Verifica que existan datos en la base de datos."
        );
      }
    } catch (error) {
      console.log("❌ Error en la consulta de analítica:", error.message);
    }
    analyticMenu();
  });
};

// ================================================
// Funciones de apoyo para entidades y relaciones
// ================================================
const getRelationsForEntity = (entity) => {
  const relationsMap = {
    customers: [
      {
        name: "OWNS",
        endpoint: "owns",
        description: "Cliente → Cuenta",
        entity: "customers",
        params: ['customerId', 'accountNumber', 'since', 'sharePercentage'],
        updateParams: ['sharePercentage'] // Solo se puede actualizar esto
      },
      {
        name: "USES",
        endpoint: "uses",
        description: "Cliente → Dispositivo",
        entity: "customers",
        params: ['customerId', 'deviceId', 'lastAccessed', 'ipAddress'],
        updateParams: ['lastAccessed', 'ipAddress']
      
      },
      {
        name: "TRUSTS",
        endpoint: "trusts",
        description: "Cliente → Cliente (Relación de confianza)",
        entity: "customers",
        params: ['customerId1', 'customerId2', 'trustLevel'],
        updateParams: ['trustLevel']
      
      },
      {

        name: 'REFERRED',
        endpoint: 'referred',
        description: 'Cliente → Cliente (Referido)',
        entity: 'customers',
        params: ['referrerId', 'referredId', 'bonusAmount'],
        updateParams: ['bonusAmount']
      },
      {
        name: "SERVICED_BY",
        endpoint: "servicedby",
        description: "Cliente → Sucursal",
        entity: "customers",
        params: ['customerId', 'branchId', 'serviceDate', 'feedbackScore'],
        updateParams: ['feedbackScore']
      },
      {
        name: "RESIDES_IN",
        endpoint: "residesin",
        description: "Cliente → Ubicación (Residencia)",
        entity: "customers",
        params: ['customerId', 'locationId', 'since', 'verificationStatus'],
        updateParams: ['verificationStatus'] 
      },
    ],
    accounts: [
      {
        name: "TRANSFER",
        endpoint: "transfers",
        description: "Cuenta → Cuenta (Transacciones)",
        entity: "accounts",
        params: ['sourceAccount', 'targetAccount', 'amount', 'currency', 'isInternational'],
        updateParams: ['amount', 'currency']
        
      },
      {
        name: "CONNECTED_VIA",
        endpoint: "connectedvia",
        description: "Cuenta → Dispositivo",
        entity: "accounts",
        params: ['accountNumber', 'deviceId', 'lastUsed', 'frequency', 'isVerified'],
        updateParams: ['frequency', 'isVerified']
      },
      {
        name: "OPERATES_AT",
        endpoint: "operatesat",  
        description: "Cuenta → Sucursal",
        entity: "accounts",
        params: ['accountNumber', 'branchCode', 'openHours'],
        updateParams: ['openHours']
      },
      {
        name: "LINKED_TO",
        endpoint: "linkedto",
        description: "Cuenta → Cuenta (Enlace)",
        entity: "accounts",
        params: ['accountNumber1', 'accountNumber2', 'linkType'],
        updateParams: ['linkType']
      },
    ],
    devices: [
      {
        name: "LOCATED_AT",
        endpoint: "locatedat",
        description: "Dispositivo → Ubicación",
        entity: "devices",
        params: ['deviceId', 'locationId', 'coordinates', 'accuracy'],
        updateParams: ['coordinates', 'accuracy']
      },
    ],
    locations: [
      {
        name: "LOCATED_AT",
        endpoint: "locatedat",
        description: "Dispositivo → Ubicación",
        entity: "locations",
        params: ['deviceId', 'locationId', 'coordinates', 'accuracy'],
        updateParams: ['coordinates', 'accuracy']
      },
    ],
    branches: [
      {
        name: "LOCATED_IN",
        endpoint: "locatedin",
        description: "Sucursal → Ubicación",
        entity: "branches",
        params: ['branchId', 'locationId', 'branchArea', 'geoAccuracy'],
        updateParams: ['branchArea', 'geoAccuracy']
      },
    ],
  };
  return relationsMap[entity] || [];
};

// ================================================
// Funciones CRUD genéricas para entidades
// ================================================
const createEntity = async (entity) => {
  const questions = {
    customers: [
      { field: "firstName", text: "Nombre: " },
      { field: "lastName", text: "Apellido: " },
      { field: "email", text: "Email: " },
    ],
    accounts: [
      { field: "accountNumber", text: "Número de cuenta: " },
      {
        field: "accountType",
        text: "Tipo de cuenta (Savings/Checking/Corporate): ",
      },
      { field: "balance", text: "Balance: " },
      { field: "currency", text: "Moneda (USD/EUR/GTQ): " },
    ],
    devices: [

      { field: 'deviceId', text: 'ID del dispositivo: ' },
      { field: 'deviceType', text: 'Tipo de dispositivo (Mobile/Desktop/Tablet): ' },
      { field: 'os', text: 'Sistema operativo (Android/iOS/Windows): ' },
      { field: 'ipAddress', text: 'Ejemplo de ip: 192.0.0.1 : ' }
    ],
    locations: [
      { field: 'locationId', text: 'ID de la ubicación: ' },
      { field: 'city', text: 'Ciudad: ' },
      { field: 'country', text: 'País: ' },
      { field: 'latitude', text: 'Latitud: ' },
      { field: 'longitude', text: 'Longitud: ' }
    ],
    branches: [
      { field: 'branchCode', text: 'Código de la sucursal: ' },
      { field: 'name', text: 'Nombre: ' },
      { field: 'address', text: 'Dirección: ' },
      { field: 'openHours', text: 'Horario: ' },
      { field: 'establishedYear', text: 'Año de fundación: ' },
      { field: 'managerName', text: 'Gerente: ' }
    ]
  };

  const inputs = {};
  for (const q of questions[entity]) {
    inputs[q.field] = await askQuestion(q.text);
  }

  try {
    const res = await axios.post(`http://localhost:3000/api/${entity}`, inputs);
    console.log("✅ Creado exitosamente:", res.data);
  } catch (err) {
    handleError(err);
  }
  entityMenu(entity);
};

// Listar entidades
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

// Obtener entidad por ID
const getEntityById = async (entity) => {
  const idField =
    entity === "customers"
      ? "customerId"
      : entity === "accounts"
      ? "accountNumber"
      : entity === "devices"
      ? "deviceId"
      : entity === "locations"
      ? "locationId"
      : entity === "branches"
      ? "branchId"
      : "id";

  const id = await askQuestion(`Ingrese el ${idField}: `);

  try {
    const res = await axios.get(`http://localhost:3000/api/${entity}/${id}`);
    console.log("🔍 Resultado:", res.data);
  } catch (err) {
    handleError(err);
  }
  entityMenu(entity);
};

const updateEntity = async (entity) => {
  const idField =
    entity === "customers"
      ? "customerId"
      : entity === "accounts"
      ? "accountNumber"
      : entity === "devices"
      ? "deviceId"
      : entity === "locations"
      ? "locationId"
      : entity === "branches"
      ? "branchId"
      : "id";

  const questions = {
    customers: [
      { field: "firstName", text: "Nombre: " },
      { field: "lastName", text: "Apellido: " },
      { field: "email", text: "Email: " },
      { field: "highRisk", text: "¿Es de alto riesgo? (true/false): " },
    ],
    accounts: [
      { field: "accountNumber", text: "Número de cuenta: " },
      {
        field: "accountType",
        text: "Tipo de cuenta (Savings/Checking/Corporate): ",
      },
      { field: "balance", text: "Balance: " },
      { field: "currency", text: "Moneda (USD/EUR/GTQ): " },
    ],
    devices: [
      { field: "deviceId", text: "ID del dispositivo: " },
      {
        field: "deviceType",
        text: "Tipo de dispositivo (Mobile/Desktop/Tablet): ",
      },
      { field: "os", text: "Sistema operativo (Android/iOS/Windows): " },
    ],
    locations: [
      { field: "locationId", text: "ID de la ubicación: " },
      { field: "address", text: "Dirección: " },
      { field: "city", text: "Ciudad: " },
      { field: "country", text: "País: " },
    ],
    branches: [
      { field: "branchId", text: "ID de la sucursal: " },
      { field: "name", text: "Nombre: " },
      { field: "manager", text: "Gerente: " },
    ],
  };

  const id = await askQuestion(`Ingrese el ${idField} a actualizar: `);
  const updates = {};

  for (const q of questions[entity]) {
    const answer = await askQuestion(
      `Nuevo valor para ${q.text} (dejar vacío para omitir): `
    );
    if (answer.trim())
      updates[q.field] =
        q.field === "highRisk" ? answer.toLowerCase() === "true" : answer;
  }

  try {
    const res = await axios.put(
      `http://localhost:3000/api/${entity}/${id}`,
      updates
    );
    console.log("✅ Actualizado:", res.data);
  } catch (err) {
    handleError(err);
  }
  entityMenu(entity);
};

const deleteEntity = async (entity) => {
  const idField =
    entity === "customers"
      ? "customerId"
      : entity === "accounts"
      ? "accountNumber"
      : entity === "devices"
      ? "deviceId"
      : entity === "locations"
      ? "locationId"
      : entity === "branches"
      ? "branchId"
      : "id";

  const id = await askQuestion(`Ingrese el ${idField} a eliminar: `);

  try {
    const res = await axios.delete(`http://localhost:3000/api/${entity}/${id}`);
    console.log("🗑️ Eliminado:", res.data.message);
  } catch (err) {
    handleError(err);
  }
  entityMenu(entity);
};

// ================================================
// Funciones CRUD genéricas para Relaciones (Relaciones)
// ================================================
const createRelation = async (relation) => {
  const inputs = {};

  // Pedir parámetros específicos de la relación
  for (const param of relation.params) {
    inputs[param] = await askQuestion(`${param}: `);
  }

  try {
    const res = await axios.post(
      `http://localhost:3000/api/relations/${relation.endpoint}`,
      inputs
    );
    console.log("✅ Relación creada:", res.data);
  } catch (err) {
    handleError(err);
  }
  relationCRUDMenu(relation);
};

const listRelations = async (relation) => {
  try {
    const res = await axios.get(
      `http://localhost:3000/api/relations/${relation.endpoint}`
    );
    console.log("\n🔗 Relaciones encontradas:");
    console.table(res.data);
  } catch (err) {
    handleError(err);
  }
  relationCRUDMenu(relation);
};

const updateRelation = async (relation) => {
  const inputs = {};

  // Pedir parámetros de identificación
  const idParams = relation.params.filter(
    (p) => p.toLowerCase().includes("id") || p === "accountnumber"
  );
  for (const param of idParams) {
    inputs[param] = await askQuestion(`${param} para buscar: `);
  }

  // Pedir nuevas propiedades
  const updatableParams = relation.params.filter((p) => !idParams.includes(p));
  for (const param of updatableParams) {
    const value = await askQuestion(
      `Nuevo valor para ${param} (dejar vacío para omitir): `
    );
    if (value) inputs[param] = value;
  }

  try {
    const res = await axios.put(
      `http://localhost:3000/api/relations/${relation.endpoint}`,
      inputs
    );
    console.log("✅ Relación actualizada:", res.data);
  } catch (err) {
    handleError(err);
  }
  relationCRUDMenu(relation);
};

const deleteRelation = async (relation) => {
  const inputs = {};

  // Pedir parámetros de identificación
  const idParams = relation.params.filter(
    (p) => p.toLowerCase().includes("id") || p === "accountnumber"
  );
  for (const param of idParams) {
    inputs[param] = await askQuestion(`${param} para eliminar: `);
  }

  try {
    const res = await axios.delete(
      `http://localhost:3000/api/relations/${relation.endpoint}`,
      { data: inputs }
    );
    console.log("🗑️ Relación eliminada:", res.data.message);
  } catch (err) {
    handleError(err);
  }
  relationCRUDMenu(relation);
};

// ================================================
// Funciones auxiliares
// ================================================
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
};

const handleError = (err) => {
  console.error("❌ Error:", err.response?.data?.error || err.message);
};

// Iniciar la aplicación
console.log("🟢 Sistema de Detección de Fraude - Neo4j");
mainMenu();
