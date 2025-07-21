// generate-tokens.js
const jwt = require('jsonwebtoken');
const path = require('path');

// Leer JWT_SECRET del .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET no encontrado en .env');
  process.exit(1);
}

console.log('✅ JWT_SECRET cargado correctamente');
console.log('=== GENERANDO TOKENS PARA URLS ACTUALIZADAS ===\n');

// Función para generar token con estructura completa
const createToken = (payload) => {
  return jwt.sign({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  }, JWT_SECRET);
};

// Admin Token - Acceso completo
const adminToken = createToken({
  id: 1,
  email: 'admin@gps.com',
  rut: '11111111-1',
  roles: [{
    roleName: 'admin',
    permissions: [
      { permissionName: 'INVENTORY_WRITE' },
      { permissionName: 'ALL_ACCESS' },
      { permissionName: 'USER_MANAGE' },
      { permissionName: 'WAREHOUSE_MANAGE' }
    ]
  }]
});

// User Token - Acceso básico
const userToken = createToken({
  id: 2,
  email: 'user@gps.com',
  rut: '22222222-2',
  roles: [{ roleName: 'user' }]
});

// Buyer Token - Acceso a compras
const buyerToken = createToken({
  id: 3,
  email: 'buyer@gps.com',
  rut: '33333333-3',
  roles: [{ roleName: 'buyer' }]
});

// Seller Token - Acceso a ventas
const sellerToken = createToken({
  id: 4,
  email: 'seller@gps.com',
  rut: '44444444-4',
  roles: [{ roleName: 'seller' }]
});

// Supervisor Token - Acceso elevado
const supervisorToken = createToken({
  id: 5,
  email: 'supervisor@gps.com',
  rut: '55555555-5',
  roles: [{
    roleName: 'supervisor',
    permissions: [
      { permissionName: 'INVENTORY_WRITE' },
      { permissionName: 'WAREHOUSE_MANAGE' },
      { permissionName: 'USER_SUPERVISE' }
    ]
  }]
});

// Mostrar tokens
console.log('🔐 ADMIN TOKEN (Production URLs):');
console.log(adminToken);
console.log('\n👤 USER TOKEN:');
console.log(userToken);
console.log('\n🛒 BUYER TOKEN:');
console.log(buyerToken);
console.log('\n💰 SELLER TOKEN:');
console.log(sellerToken);
console.log('\n👨‍💼 SUPERVISOR TOKEN:');
console.log(supervisorToken);

console.log('\n=== URLS DE MICROSERVICIOS ACTUALIZADAS ===');
console.log('🔗 USUARIOS_URL:', process.env.USUARIOS_URL || 'https://users-microservice-production.up.railway.app/');
console.log('📦 INVENTARIO_URL:', process.env.INVENTARIO_URL || 'https://inventario-gps-production.up.railway.app/');
console.log('💰 TRANSACCIONES_URL:', process.env.TRANSACCIONES_URL || 'https://inventory-microservice-production-a316.up.railway.app/');
console.log('👥 FRONTUSERLIST_URL:', process.env.FRONTUSERLIST_URL || 'https://frontuserslist-production.up.railway.app/');

// Verificar tokens generados
console.log('\n=== VERIFICACIÓN DE TOKENS ===');
try {
  const decodedAdmin = jwt.verify(adminToken, JWT_SECRET);
  console.log('✅ Admin token válido:', decodedAdmin.email, decodedAdmin.roles[0].roleName);
  
  const decodedBuyer = jwt.verify(buyerToken, JWT_SECRET);
  console.log('✅ Buyer token válido:', decodedBuyer.email, decodedBuyer.roles[0].roleName);
} catch (error) {
  console.error('❌ Error verificando tokens:', error.message);
}

console.log('\n=== CONFIGURACIÓN POSTMAN ===');
console.log('Environment Variables:');
console.log('base_url: https://api-gateway-production-f577.up.railway.app');
console.log('usuarios_url: https://users-microservice-production.up.railway.app');
console.log('inventario_url: https://inventario-gps-production.up.railway.app');
console.log('transacciones_url: https://inventory-microservice-production-a316.up.railway.app');
console.log('frontuserlist_url: https://frontuserslist-production.up.railway.app');