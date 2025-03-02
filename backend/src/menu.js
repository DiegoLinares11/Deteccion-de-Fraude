/* 
const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const menu = () => {
  console.log('\n🟢 Bienvenido al Sistema de Detección de Fraude');
  console.log('1. Ver todos los nodos de Customers');
  console.log('2. Ver todos los nodos de Accounts');
  console.log('3. Ver todas las relaciones OWNS');
  console.log('4. Crear una relación OWNS');
  console.log('5. Salir');
  
  rl.question('\nSelecciona una opción (1-5): ', (option) => {
    switch (option) {
      case '1':
        fetchNodes('customers');
        break;
      case '2':
        fetchNodes('accounts');
        break;
      case '3':
        fetchRelations('owns');
        break;
      case '4':
        createOwnsRelation();
        break;
      case '5':
        console.log('👋 Saliendo del sistema...');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('❌ Opción inválida');
        menu();
        break;
    }
  });
};

const fetchNodes = async (type) => {
  try {
    const res = await axios.get(`http://localhost:3000/api/${type}`);
    console.log(`\n📊 ${type.toUpperCase()} encontrados:`);
    console.table(res.data);
  } catch (err) {
    console.error('❌ Error al obtener nodos:', err.message);
  }
  menu();
};

const fetchRelations = async (type) => {
  try {
    const res = await axios.get(`http://localhost:3000/api/relations/${type}`);
    console.log(`\n🔗 Relaciones ${type.toUpperCase()}:`);
    console.table(res.data);
  } catch (err) {
    console.error('❌ Error al obtener relaciones:', err.message);
  }
  menu();
};

const createOwnsRelation = () => {
    rl.question('Ingrese customerId: ', (customerId) => {
      rl.question('Ingrese accountNumber: ', (accountNumber) => {
        rl.question('Fecha de inicio (YYYY-MM-DD): ', (since) => {
          rl.question('Porcentaje de propiedad (ej: 50): ', async (sharePercentage) => {
            try {
              const res = await axios.post('http://localhost:3000/api/relations/owns', {
                customerId,
                accountNumber,
                since,
                sharePercentage: parseFloat(sharePercentage)
              });
  
              console.log('✅ Relación OWNS creada exitosamente:', res.data);
            } catch (err) {
              if (err.response) {
                console.error(`❌ Error: ${err.response.data.error}`);
              } else {
                console.error('❌ Error inesperado:', err.message);
              }
            }
            menu();
          });
        });
      });
    });
};

menu();
*/