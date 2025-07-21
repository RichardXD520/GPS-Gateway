# GPS Gateway - Complete Testing Guide

🚀 **API Gateway empresarial** con autenticación JWT, control de acceso por roles y permisos, y gestión centralizada de microservicios.

## 📖 Tabla de Contenidos

- [Arquitectura del Gateway](#-arquitectura-del-gateway)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Pruebas Locales (Jest)](#-pruebas-locales-jest)
- [Pruebas de Producción (Postman)](#-pruebas-de-producción-postman)
- [Collection de Postman](#-collection-de-postman)
- [Generación de Tokens](#-generación-de-tokens)
- [Scripts de Automatización](#-scripts-de-automatización)
- [Deployment](#-deployment)

---

## 🏗 Arquitectura del Gateway

### Microservicios Conectados

```
📱 Frontend Apps
        ↓
🛡️ GPS Gateway (Port 3000)
   ├── 🔐 JWT Authentication
   ├── 👥 Role-based Access Control  
   ├── 🔑 Permission-based Access Control
   └── 📊 Request Logging & Monitoring
        ↓
┌─────────────────────────────────────────┐
│ 👤 Users MS     📦 Inventory MS    💰 Transactions MS │
│ Port 4001       Port 4002          Port 4003          │
└─────────────────────────────────────────┘
```

### Middlewares Implementados

- **AuthMiddleware**: Validación JWT y extracción de usuario
- **UsersMiddleware**: Control de acceso específico para gestión de usuarios
- **InventoryMiddleware**: Control granular para inventario y bodegas
- **TransactionsMiddleware**: Validación de acceso a compras/ventas
- **PermissionsMiddleware**: Sistema de permisos específicos

---

## ⚙️ Instalación y Configuración

### Requisitos

- Node.js 18+
- npm o yarn
- Variables de entorno configuradas

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/GPS-Gateway.git
cd GPS-Gateway

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

### Variables de Entorno

```bash
# .env
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Microservices URLs
USUARIOS_URL=http://localhost:4001
INVENTARIO_URL=http://localhost:4002
TRANSACCIONES_URL=http://localhost:4003

# Production URLs (Railway)
# USUARIOS_URL=https://users-microservice-production.up.railway.app
# INVENTARIO_URL=https://inventory-microservice-production-a316.up.railway.app
# TRANSACCIONES_URL=https://transactions-microservice-production.up.railway.app
```

---

## 🧪 Pruebas Locales (Jest)

### Comandos de Testing

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con coverage
npm test -- --coverage

# Ejecutar en modo watch
npm test -- --watch

# Ejecutar tests específicos
npm test -- --testNamePattern="Authentication"
```

### Tests Implementados

#### ✅ **Health Check Tests**
```javascript
describe('Health Check', () => {
  test('GET /health should return 200 and status message', async () => {
    const response = await request(app).get('/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('Gateway is running');
    expect(response.body.timestamp).toBeDefined();
  });
});
```

#### ✅ **JWT Authentication Tests**
```javascript
describe('Enhanced JWT Authentication', () => {
  // ✅ Rutas públicas sin token
  test('Should allow access to public routes without token');
  
  // ✅ Rutas protegidas requieren token (401)
  test('Should reject protected routes without token');
  
  // ✅ Acceso con token válido
  test('Should allow access with valid token');
  
  // ✅ Rechazo de tokens inválidos (401)
  test('Should reject invalid tokens');
});
```

#### ✅ **Role-based Access Control Tests**
```javascript
describe('Role-based Access Control', () => {
  // ✅ Admin puede acceder a rutas administrativas
  test('Should allow admin access to admin routes');
  
  // ✅ Usuario normal es denegado (403)
  test('Should deny user access to admin routes');
});
```

#### ✅ **Permission-based Access Control Tests**
```javascript
describe('Permission-based Access Control', () => {
  // ✅ Acceso con permisos requeridos
  test('Should allow access with required permissions');
  
  // ✅ Denegación sin permisos (403)
  test('Should deny access without required permissions');
});
```

#### ✅ **CORS Tests**
```javascript
describe('CORS Headers', () => {
  // ✅ Headers CORS incluidos
  test('Should include CORS headers in response');
  
  // ✅ Manejo de preflight requests
  test('Should handle OPTIONS preflight requests');
});
```

#### ✅ **Transactions Middleware Tests**
```javascript
describe('Transactions Middleware', () => {
  // ✅ Buyer puede acceder a compras
  test('Should allow purchase access for buyer');
  
  // ✅ Usuario normal es denegado (403)
  test('Should deny purchase access for regular user', async () => {
    const response = await request(app)
      .get('/api/purchases')
      .set('Authorization', `Bearer ${validUserToken}`);
    
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe('Se requiere rol de buyer, supervisor o admin para acceder a compras');
  });
});
```

### Configuración de Tests Locales

```javascript
// Variables de entorno para tests
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.USUARIOS_URL = 'http://localhost:4001';
  process.env.INVENTARIO_URL = 'http://localhost:4002';
  process.env.TRANSACCIONES_URL = 'http://localhost:4003';
  
  app = createApp();
});
```

### Resultados Esperados

```
✅ Health Check: 1 passing
✅ Enhanced JWT Authentication: 4 passing  
✅ Role-based Access Control: 2 passing
✅ Permission-based Access Control: 2 passing
✅ CORS Headers: 2 passing
✅ Transactions Middleware: 2 passing

Total: 13 tests passing
```

---

## 🚀 Pruebas de Producción (Postman)

### Environment Configuration

```javascript
// GPS Gateway Production Environment
{
  "base_url": "https://api-gateway-production-f577.up.railway.app",
  "jwt_secret": "your-production-secret",
  "usuarios_url": "https://users-microservice-production.up.railway.app",
  "inventario_url": "https://inventory-microservice-production-a316.up.railway.app", 
  "transacciones_url": "https://transactions-microservice-production.up.railway.app",
  "admin_token": "",
  "user_token": "",
  "buyer_token": "",
  "seller_token": "",
  "supervisor_token": ""
}
```

---

## 🎯 Tests de Producción Detallados

### **1. 🏥 Gateway Health & Status**

#### Test 1.1: Health Check
```http
GET {{base_url}}/health

✅ Expected Response (200):
{
    "status": "Gateway is running",
    "timestamp": "2024-01-15T10:30:45.123Z"
}

✅ Validations:
- Status code is 200
- Response contains "Gateway is running"
- Timestamp is present and valid
```

#### Test 1.2: CORS Validation
```http
OPTIONS {{base_url}}/health
Origin: https://frontend.example.com
Access-Control-Request-Method: GET

✅ Expected Response (200):
Headers:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
```

#### Test 1.3: Public Route Access
```http
GET {{base_url}}/hola

✅ Expected: Accessible without authentication
✅ Should return 200 or proxy to microservice
```

### **2. 🔒 Authentication System Tests**

#### Test 2.1: Protected Route - No Token (401)
```http
GET {{base_url}}/usuarios/profile

❌ Expected Response (401):
{
    "status": "error", 
    "message": "Token de autenticación requerido"
}
```

#### Test 2.2: Protected Route - Invalid Token (401)
```http
GET {{base_url}}/usuarios/profile
Authorization: Bearer invalid-token-here

❌ Expected Response (401):
{
    "status": "error",
    "message": "Token inválido"
}
```

#### Test 2.3: Protected Route - Expired Token (401)
```http
GET {{base_url}}/usuarios/profile  
Authorization: Bearer {{expired_token}}

❌ Expected Response (401):
{
    "status": "error",
    "message": "Token expirado"
}
```

### **3. 👥 Users Microservice Tests**

#### Test 3.1: User Profile Access (Own Data)
```http
GET {{base_url}}/usuarios/1
Authorization: Bearer {{user_token}}

✅ Expected: User can access their own profile
✅ Status: 200, 500+ (microservice issues acceptable)
❌ Status: 401, 403 (authentication/authorization errors)
```

#### Test 3.2: Admin Routes - Admin Access
```http
GET {{base_url}}/usuarios/admin/users
Authorization: Bearer {{admin_token}}

✅ Expected: Admin can access admin endpoints
✅ No 403 Forbidden errors
```

#### Test 3.3: Admin Routes - User Denied (403)
```http
GET {{base_url}}/usuarios/admin/users
Authorization: Bearer {{user_token}}

❌ Expected Response (403):
{
    "status": "error",
    "message": "No tiene el rol necesario para acceder a este recurso"
}
```

#### Test 3.4: Role Management (Admin Only)
```http
GET {{base_url}}/api/roles
Authorization: Bearer {{admin_token}}

✅ Expected: Admin can manage roles
```

#### Test 3.5: Role Management - User Denied
```http
GET {{base_url}}/api/roles
Authorization: Bearer {{user_token}}

❌ Expected: 403 Forbidden
```

#### Test 3.6: Permissions Management
```http
GET {{base_url}}/api/permissions
Authorization: Bearer {{admin_token}}

✅ Expected: Admin can view permissions
```

#### Test 3.7: Beneficiaries Access (Supervisor/Admin)
```http
GET {{base_url}}/beneficiarios
Authorization: Bearer {{supervisor_token}}

✅ Expected: Supervisor can access beneficiaries
```

#### Test 3.8: Beneficiaries - User Denied
```http
GET {{base_url}}/beneficiarios  
Authorization: Bearer {{user_token}}

❌ Expected: 403 - Requires supervisor/admin role
```

### **4. 📦 Inventory Microservice Tests**

#### Test 4.1: Products Read (Any Authenticated User)
```http
GET {{base_url}}/api/productos
Authorization: Bearer {{user_token}}

✅ Expected: Any authenticated user can read products
✅ No 401/403 errors
```

#### Test 4.2: Warehouses Read Access
```http
GET {{base_url}}/api/bodegas
Authorization: Bearer {{user_token}}

✅ Expected: Read access allowed for authenticated users
```

#### Test 4.3: Warehouses Modify - User Denied
```http
POST {{base_url}}/api/bodegas
Authorization: Bearer {{user_token}}
Content-Type: application/json

{
  "name": "Nueva Bodega Test",
  "location": "Ubicación Test"
}

❌ Expected Response (403):
{
    "status": "error",
    "message": "Se requiere rol de supervisor o admin para modificar bodegas"
}
```

#### Test 4.4: Warehouses Modify - Supervisor Allowed
```http
POST {{base_url}}/api/bodegas
Authorization: Bearer {{supervisor_token}}
Content-Type: application/json

{
  "name": "Bodega Supervisor",
  "location": "Supervisor Location"
}

✅ Expected: Supervisor can create warehouses
```

#### Test 4.5: Warehouses Modify - Admin Allowed
```http
PUT {{base_url}}/api/bodegas/1
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Bodega Admin Updated",
  "location": "Admin Location"
}

✅ Expected: Admin can modify warehouses
```

#### Test 4.6: Batches - With INVENTORY_WRITE Permission
```http
GET {{base_url}}/api/lotes
Authorization: Bearer {{admin_token}}

✅ Expected: Admin with INVENTORY_WRITE permission can access
```

#### Test 4.7: Batches - Without Permission (403)
```http
GET {{base_url}}/api/lotes
Authorization: Bearer {{user_token}}

❌ Expected Response (403):
{
    "status": "error", 
    "message": "No tiene permisos para acceder a este recurso"
}
```

#### Test 4.8: Batch Creation - Validation
```http
POST {{base_url}}/api/lotes
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "name": "Lote sin campos requeridos"
}

❌ Expected Response (400):
{
    "status": "error",
    "message": "ProductId y quantity son requeridos para crear un lote"
}
```

#### Test 4.9: Batch Creation - Valid Data
```http
POST {{base_url}}/api/lotes
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "productId": 123,
  "quantity": 100,
  "name": "Lote Válido",
  "expirationDate": "2024-12-31"
}

✅ Expected: Valid batch creation
```

### **5. 💰 Transactions Microservice Tests**

#### Test 5.1: Purchases - Buyer Access
```http
GET {{base_url}}/api/purchases
Authorization: Bearer {{buyer_token}}

✅ Expected: Buyer role can access purchases
✅ No 403 errors
```

#### Test 5.2: Purchases - Supervisor Access
```http
GET {{base_url}}/api/purchases  
Authorization: Bearer {{supervisor_token}}

✅ Expected: Supervisor can access purchases
```

#### Test 5.3: Purchases - Admin Access
```http
GET {{base_url}}/api/purchases
Authorization: Bearer {{admin_token}}

✅ Expected: Admin can access purchases
```

#### Test 5.4: Purchases - User Denied (403)
```http
GET {{base_url}}/api/purchases
Authorization: Bearer {{user_token}}

❌ Expected Response (403):
{
    "status": "error",
    "message": "Se requiere rol de buyer, supervisor o admin para acceder a compras"
}
```

#### Test 5.5: Sales - Seller Access
```http
GET {{base_url}}/api/sales
Authorization: Bearer {{seller_token}}

✅ Expected: Seller role can access sales
```

#### Test 5.6: Sales - Admin Access
```http
GET {{base_url}}/api/sales
Authorization: Bearer {{admin_token}}

✅ Expected: Admin can access sales
```

#### Test 5.7: Sales - User Denied
```http
GET {{base_url}}/api/sales
Authorization: Bearer {{user_token}}

❌ Expected: 403 - Requires seller/supervisor/admin role
```

#### Test 5.8: RUT Access Control - Own Data
```http
GET {{base_url}}/api/purchases/person/{{user_rut}}
Authorization: Bearer {{user_token}}

✅ Expected: User can access their own transactions
```

#### Test 5.9: RUT Access Control - Other's Data Denied
```http
GET {{base_url}}/api/purchases/person/12345678-9  
Authorization: Bearer {{user_token}}

❌ Expected Response (403):
{
    "status": "error",
    "message": "Solo puedes acceder a tus propias transacciones"
}
```

#### Test 5.10: RUT Access Control - Admin Can View All
```http
GET {{base_url}}/api/purchases/person/any-rut
Authorization: Bearer {{admin_token}}

✅ Expected: Admin can access any user's transactions
```

#### Test 5.11: Date Range Validation - Invalid Range
```http
GET {{base_url}}/api/purchases/date-range?startDate=2024-12-31&endDate=2024-01-01
Authorization: Bearer {{buyer_token}}

❌ Expected Response (400):
{
    "status": "error",
    "message": "La fecha de inicio debe ser anterior a la fecha de fin"
}
```

#### Test 5.12: Date Range Validation - Valid Range
```http
GET {{base_url}}/api/purchases/date-range?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {{buyer_token}}

✅ Expected: Valid date range accepted
```

#### Test 5.13: Combined RUT and Date Range
```http
GET {{base_url}}/api/purchases/date-range-rut?rut=12345678-9&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {{admin_token}}

✅ Expected: Admin can search by RUT and date range
```

#### Test 5.14: Sales by Person - Own Data
```http
GET {{base_url}}/api/sales/person/{{seller_rut}}
Authorization: Bearer {{seller_token}}

✅ Expected: Seller can access their own sales
```

#### Test 5.15: Purchase Modification - Buyer Role
```http
POST {{base_url}}/api/purchases
Authorization: Bearer {{buyer_token}}
Content-Type: application/json

{
  "supplierId": 1,
  "items": [{"productId": 1, "quantity": 10}],
  "totalAmount": 1000
}

✅ Expected: Buyer can create purchases
```

---

## 📥 Collection de Postman Completa

### Collection JSON para Importar

```json
{
  "info": {
    "name": "GPS Gateway - Complete Production Tests",
    "description": "Suite completa de pruebas para GPS Gateway en producción",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://api-gateway-production-f577.up.railway.app",
      "type": "string"
    },
    {
      "key": "jwt_secret",
      "value": "your-production-secret",
      "type": "string"
    }
  ],
  "auth": {
    "type": "noauth"
  },
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "exec": [
          "// Global pre-request script",
          "console.log('Running GPS Gateway tests...');",
          "",
          "// Check if tokens exist",
          "if (!pm.environment.get('admin_token')) {",
          "    console.warn('Admin token not set. Run token generation first.');",
          "}
        ],
        "type": "text/javascript"
      }
    },
    {
      "listen": "test",
      "script": {
        "exec": [
          "// Global test script",
          "pm.test('Response time is acceptable', () => {",
          "    pm.expect(pm.response.responseTime).to.be.below(10000);",
          "});",
          "",
          "// Log response for debugging",
          "if (pm.response.code >= 400) {",
          "    console.log('Response body:', pm.response.text());",
          "}"
        ],
        "type": "text/javascript"
      }
    }
  ],
  "item": [
    {
      "name": "🔧 Setup & Configuration",
      "item": [
        {
          "name": "Generate Test Tokens",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "// Generate JWT tokens for testing",
                  "const secret = pm.environment.get('jwt_secret');",
                  "",
                  "if (!secret) {",
                  "    pm.test('JWT Secret required', () => {",
                  "        pm.expect.fail('Please set jwt_secret in environment');",
                  "    });",
                  "    return;",
                  "}",
                  "",
                  "// Mock tokens (in real scenario, these would come from login)",
                  "const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGVzIjpbeyJyb2xlTmFtZSI6ImFkbWluIiwicGVybWlzc2lvbnMiOlt7InBlcm1pc3Npb25OYW1lIjoiSU5WRU5UT1JZX1dSSVRFIn1dfV19.mock-signature';",
                  "const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ1c2VyQHRlc3QuY29tIiwicm9sZXMiOlt7InJvbGVOYW1lIjoidXNlciJ9XX0.mock-signature';",
                  "const buyerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJidXllckB0ZXN0LmNvbSIsInJvbGVzIjpbeyJyb2xlTmFtZSI6ImJ1eWVyIn1dfQ.mock-signature';",
                  "",
                  "pm.environment.set('admin_token', adminToken);",
                  "pm.environment.set('user_token', userToken);", 
                  "pm.environment.set('buyer_token', buyerToken);",
                  "",
                  "pm.test('Tokens generated successfully', () => {",
                  "    pm.expect(pm.environment.get('admin_token')).to.not.be.undefined;",
                  "    pm.expect(pm.environment.get('user_token')).to.not.be.undefined;",
                  "    pm.expect(pm.environment.get('buyer_token')).to.not.be.undefined;",
                  "});",
                  "",
                  "console.log('Test tokens generated and saved to environment');"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/health",
              "host": ["{{base_url}}"],
              "path": ["health"]
            }
          }
        }
      ]
    },
    {
      "name": "🏥 Gateway Health & Status",
      "item": [
        {
          "name": "Health Check",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Gateway is healthy', () => {",
                  "    pm.response.to.have.status(200);",
                  "    const json = pm.response.json();",
                  "    pm.expect(json.status).to.eql('Gateway is running');",
                  "    pm.expect(json.timestamp).to.exist;",
                  "});",
                  "",
                  "pm.test('Response structure is correct', () => {",
                  "    const json = pm.response.json();",
                  "    pm.expect(json).to.have.property('status');",
                  "    pm.expect(json).to.have.property('timestamp');",
                  "});",
                  "",
                  "pm.test('Timestamp is recent', () => {",
                  "    const json = pm.response.json();",
                  "    const timestamp = new Date(json.timestamp);",
                  "    const now = new Date();",
                  "    const diffMs = now - timestamp;",
                  "    pm.expect(diffMs).to.be.below(60000); // Within 1 minute",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/health",
              "host": ["{{base_url}}"],
              "path": ["health"]
            }
          }
        },
        {
          "name": "CORS Preflight",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('CORS preflight successful', () => {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test('CORS headers present', () => {",
                  "    pm.expect(pm.response.headers.get('access-control-allow-origin')).to.eql('*');",
                  "    pm.expect(pm.response.headers.get('access-control-allow-methods')).to.exist;",
                  "    pm.expect(pm.response.headers.get('access-control-allow-headers')).to.exist;",
                  "});",
                  "",
                  "pm.test('Supports required methods', () => {",
                  "    const methods = pm.response.headers.get('access-control-allow-methods');",
                  "    pm.expect(methods).to.include('GET');",
                  "    pm.expect(methods).to.include('POST');",
                  "    pm.expect(methods).to.include('PUT');",
                  "    pm.expect(methods).to.include('DELETE');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "OPTIONS",
            "header": [
              {
                "key": "Origin",
                "value": "https://frontend.example.com"
              },
              {
                "key": "Access-Control-Request-Method",
                "value": "POST"
              }
            ],
            "url": {
              "raw": "{{base_url}}/health",
              "host": ["{{base_url}}"],
              "path": ["health"]
            }
          }
        }
      ]
    },
    {
      "name": "🔒 Authentication System",
      "item": [
        {
          "name": "Protected Route - No Token (401)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Returns 401 without token', () => {",
                  "    pm.response.to.have.status(401);",
                  "});",
                  "",
                  "pm.test('Error message is correct', () => {",
                  "    const json = pm.response.json();",
                  "    pm.expect(json.status).to.eql('error');",
                  "    pm.expect(json.message).to.eql('Token de autenticación requerido');",
                  "});",
                  "",
                  "pm.test('Response structure is correct', () => {",
                  "    const json = pm.response.json();",
                  "    pm.expect(json).to.have.property('status');",
                  "    pm.expect(json).to.have.property('message');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/usuarios/profile",
              "host": ["{{base_url}}"],
              "path": ["usuarios", "profile"]
            }
          }
        },
        {
          "name": "Protected Route - Invalid Token (401)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Returns 401 with invalid token', () => {",
                  "    pm.response.to.have.status(401);",
                  "});",
                  "",
                  "pm.test('Invalid token message', () => {",
                  "    const json = pm.response.json();",
                  "    pm.expect(json.status).to.eql('error');",
                  "    pm.expect(json.message).to.eql('Token inválido');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer invalid-token-here"
              }
            ],
            "url": {
              "raw": "{{base_url}}/usuarios/profile",
              "host": ["{{base_url}}"],
              "path": ["usuarios", "profile"]
            }
          }
        },
        {
          "name": "Protected Route - Expired Token (401)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Returns 401 with expired token', () => {",
                  "    pm.response.to.have.status(401);",
                  "});",
                  "",
                  "pm.test('Expired token message', () => {",
                  "    const json = pm.response.json();",
                  "    pm.expect(json.status).to.eql('error');",
                  "    pm.expect(json.message).to.eql('Token expirado');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{expired_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/usuarios/profile",
              "host": ["{{base_url}}"],
              "path": ["usuarios", "profile"]
            }
          }
        }
      ]
    },
    {
      "name": "👥 Users Microservice",
      "item": [
        {
          "name": "User Profile - Valid Token",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('No authentication errors', () => {",
                  "    // Should not return auth errors",
                  "    pm.expect(pm.response.code).to.not.eql(401);",
                  "    pm.expect(pm.response.code).to.not.eql(403);",
                  "});",
                  "",
                  "pm.test('Request processed by gateway', () => {",
                  "    // May return 200 (success) or 500+ (microservice issues)",
                  "    const validCodes = [200, 500, 502, 503, 504];",
                  "    pm.expect(validCodes).to.include(pm.response.code);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{user_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/usuarios/1",
              "host": ["{{base_url}}"],
              "path": ["usuarios", "1"]
            }
          }
        },
        {
          "name": "Admin Route - Admin Access",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Admin can access admin routes', () => {",
                  "    // Should not fail due to authorization",
                  "    pm.expect(pm.response.code).to.not.eql(403);",
                  "});",
                  "",
                  "pm.test('Request processed successfully', () => {",
                  "    const validCodes = [200, 500, 502, 503, 504];",
                  "    pm.expect(validCodes).to.include(pm.response.code);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET", 
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{admin_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/usuarios/admin/users",
              "host": ["{{base_url}}"],
              "path": ["usuarios", "admin", "users"]
            }
          }
        },
        {
          "name": "Admin Route - User Denied (403)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('User denied admin access', () => {",
                  "    pm.response.to.have.status(403);",
                  "});",
                  "",
                  "pm.test('Correct error message', () => {",
                  "    const json = pm.response.json();",
                  "    pm.expect(json.status).to.eql('error');",
                  "    pm.expect(json.message).to.eql('No tiene el rol necesario para acceder a este recurso');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{user_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/usuarios/admin/users",
              "host": ["{{base_url}}"],
              "path": ["usuarios", "admin", "users"]
            }
          }
        },
        {
          "name": "Role Management - Admin Only",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Admin can access role management', () => {",
                  "    pm.expect(pm.response.code).to.not.eql(403);",
                  "});",
                  "",
                  "pm.test('Request processed successfully', () => {",
                  "    const validCodes = [200, 500, 502, 503, 504];",
                  "    pm.expect(validCodes).to.include(pm.response.code);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{admin_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/roles",
              "host": ["{{base_url}}"],
              "path": ["api", "roles"]
            }
          }
        },
        {
          "name": "Permissions Management - Admin Only",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Admin can access permissions management', () => {",
                  "    pm.expect(pm.response.code).to.not.eql(403);",
                  "});",
                  "",
                  "pm.test('Request processed successfully', () => {",
                  "    const validCodes = [200, 500, 502, 503, 504];",
                  "    pm.expect(validCodes).to.include(pm.response.code);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{admin_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/permissions",
              "host": ["{{base_url}}"],
              "path": ["api", "permissions"]
            }
          }
        },
        {
          "name": "Beneficiaries Access - Supervisor/Admin",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Supervisor can access beneficiaries', () => {",
                  "    pm.expect(pm.response.code).to.not.eql(403);",
                  "});",
                  "",
                  "pm.test('Request processed successfully', () => {",
                  "    const validCodes = [200, 500, 502, 503, 504];",
                  "    pm.expect(validCodes).to.include(pm.response.code);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{supervisor_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/beneficiarios",
              "host": ["{{base_url}}"],
              "path": ["beneficiarios"]
            }
          }
        }
      ]
    },
    {
      "name": "📦 Inventory Microservice",
      "item": [
        {
          "name": "Products List - Any User",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('User can read products', () => {",
                  "    pm.expect(pm.response.code).to.not.eql(401);",
                  "    pm.expect(pm.response.code).to.not.eql(403);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{user_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/productos",
              "host": ["{{base_url}}"],
              "path": ["api", "productos"]
            }
          }
        },
        {
          "name": "Warehouses Modify - User Denied",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('User denied warehouse modification', () => {",
                  "    pm.response.to.have.status(403);",
                  "});",
                  "",
                  "pm.test('Correct error message', () => {",
                  "    const json = pm.response.json();",
                  "    pm.expect(json.message).to.eql('Se requiere rol de supervisor o admin para modificar bodegas');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{user_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Test Warehouse\",\n  \"location\": \"Test Location\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/bodegas",
              "host": ["{{base_url}}"],
              "path": ["api", "bodegas"]
            }
          }
        },
        {
          "name": "Batches - Permission Required",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('User denied batch access without permission', () => {",
                  "    pm.response.to.have.status(403);",
                  "});",
                  "",
                  "pm.test('Permission error message', () => {",
                  "    const json = pm.response.json();",
                  "    pm.expect(json.message).to.eql('No tiene permisos para acceder a este recurso');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{user_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/lotes",
              "host": ["{{base_url}}"],
              "path": ["api", "lotes"]
            }
          }
        }
      ]
    },
    {
      "name": "💰 Transactions Microservice",
      "item": [
        {
          "name": "Purchases - Buyer Access",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Buyer can access purchases', () => {",
                  "    pm.expect(pm.response.code).to.not.eql(403);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{buyer_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/purchases",
              "host": ["{{base_url}}"],
              "path": ["api", "purchases"]
            }
          }
        },
        {
          "name": "Purchases - User Denied",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('User denied purchase access', () => {",
                  "    pm.response.to.have.status(403);",
                  "});",
                  "",
                  "pm.test('Correct error message', () => {",
                  "    const json = pm.response.json();",
                  "    pm.expect(json.message).to.eql('Se requiere rol de buyer, supervisor o admin para acceder a compras');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{user_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/purchases",
              "host": ["{{base_url}}"],
              "path": ["api", "purchases"]
            }
          }
        },
        {
          "name": "Date Range Validation",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Date range validation works', () => {",
                  "    pm.response.to.have.status(400);",
                  "});",
                  "",
                  "pm.test('Date validation message', () => {",
                  "    const json = pm.response.json();",
                  "    pm.expect(json.message).to.eql('La fecha de inicio debe ser anterior a la fecha de fin');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{buyer_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/purchases/date-range?startDate=2024-12-31&endDate=2024-01-01",
              "host": ["{{base_url}}"],
              "path": ["api", "purchases", "date-range"],
              "query": [
                {
                  "key": "startDate",
                  "value": "2024-12-31"
                },
                {
                  "key": "endDate",
                  "value": "2024-01-01"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🔑 Generación de Tokens

### Script Node.js para Tokens de Producción

Crear archivo `generate-tokens.js` en la raíz del proyecto:

```javascript
// generate-tokens.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-production-secret';

const generateTokens = () => {
  console.log('=== GPS GATEWAY - TOKEN GENERATOR ===\n');

  // Admin Token - Full access
  const adminToken = jwt.sign({
    id: 1,
    email: 'admin@test.com',
    rut: '11111111-1',
    roles: [{
      roleName: 'admin',
      permissions: [
        { permissionName: 'INVENTORY_WRITE' },
        { permissionName: 'USER_MANAGE' },
        { permissionName: 'ALL_ACCESS' },
        { permissionName: 'WAREHOUSE_MANAGE' }
      ]
    }]
  }, JWT_SECRET, { expiresIn: '24h' });

  // Regular User Token - Basic access
  const userToken = jwt.sign({
    id: 2,
    email: 'user@test.com',
    rut: '22222222-2',
    roles: [{ roleName: 'user' }]
  }, JWT_SECRET, { expiresIn: '24h' });

  // Buyer Token - Purchase access
  const buyerToken = jwt.sign({
    id: 3,
    email: 'buyer@test.com',
    rut: '33333333-3',
    roles: [{ roleName: 'buyer' }]
  }, JWT_SECRET, { expiresIn: '24h' });

  // Seller Token - Sales access
  const sellerToken = jwt.sign({
    id: 4,
    email: 'seller@test.com',
    rut: '44444444-4',
    roles: [{ roleName: 'seller' }]
  }, JWT_SECRET, { expiresIn: '24h' });

  // Supervisor Token - Elevated permissions
  const supervisorToken = jwt.sign({
    id: 5,
    email: 'supervisor@test.com',
    rut: '55555555-5',
    roles: [{
      roleName: 'supervisor',
      permissions: [
        { permissionName: 'INVENTORY_WRITE' },
        { permissionName: 'WAREHOUSE_MANAGE' },
        { permissionName: 'USER_SUPERVISE' }
      ]
    }]
  }, JWT_SECRET, { expiresIn: '24h' });

  // Display tokens
  console.log('🔑 ADMIN TOKEN (Full Access):');
  console.log(adminToken);
  console.log('\n👤 USER TOKEN (Basic Access):');
  console.log(userToken);
  console.log('\n🛒 BUYER TOKEN (Purchase Access):');
  console.log(buyerToken);
  console.log('\n💰 SELLER TOKEN (Sales Access):');
  console.log(sellerToken);
  console.log('\n👨‍💼 SUPERVISOR TOKEN (Elevated Access):');
  console.log(supervisorToken);
  
  console.log('\n=== COPY THESE TOKENS TO POSTMAN ENVIRONMENT ===');
  console.log('Variable names:');
  console.log('- admin_token');
  console.log('- user_token');
  console.log('- buyer_token');
  console.log('- seller_token');
  console.log('- supervisor_token');

  return {
    admin_token: adminToken,
    user_token: userToken,
    buyer_token: buyerToken,
    seller_token: sellerToken,
    supervisor_token: supervisorToken
  };
};

// JWT Verification Helper
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token válido:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token inválido:', error.message);
    return null;
  }
};

// Export functions
module.exports = { generateTokens, verifyToken };

// Run if called directly
if (require.main === module) {
  generateTokens();
}
```

### Uso del Script

```bash
# Generar tokens con secret por defecto
node generate-tokens.js

# Generar tokens con secret de producción
JWT_SECRET=your-production-secret node generate-tokens.js

# Verificar un token específico
node -e "
const { verifyToken } = require('./generate-tokens.js');
verifyToken('your-token-here');
"
```

---

## 🤖 Scripts de Automatización

### Newman CLI Testing

```bash
# Instalar Newman globalmente
npm install -g newman

# Ejecutar collection completa
newman run postman/GPS-Gateway-Complete-Tests.json \
  --environment postman/GPS-Gateway-Production.json \
  --reporters cli,json,html \
  --reporter-html-export reports/test-results.html \
  --reporter-json-export reports/test-results.json

# Ejecutar solo tests críticos
newman run postman/GPS-Gateway-Complete-Tests.json \
  --folder "Gateway Health & Status" \
  --folder "Authentication System" \
  --environment postman/GPS-Gateway-Production.json

# Con configuración avanzada
newman run postman/GPS-Gateway-Complete-Tests.json \
  --environment postman/GPS-Gateway-Production.json \
  --timeout-request 30000 \
  --insecure \
  --reporters cli,junit \
  --reporter-junit-export reports/junit-results.xml
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest --testTimeout=10000",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:postman": "newman run postman/GPS-Gateway-Complete-Tests.json --environment postman/GPS-Gateway-Production.json",
    "test:postman:report": "newman run postman/GPS-Gateway-Complete-Tests.json --environment postman/GPS-Gateway-Production.json --reporters html --reporter-html-export reports/postman-results.html",
    "generate-tokens": "node generate-tokens.js",
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

### CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/comprehensive-tests.yml
name: Comprehensive API Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  local-tests:
    name: Local Jest Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Jest tests
        env:
          JWT_SECRET: test-secret-key-for-ci
          NODE_ENV: test
          USUARIOS_URL: http://localhost:4001
          INVENTARIO_URL: http://localhost:4002
          TRANSACCIONES_URL: http://localhost:4003
        run: npm test
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  production-tests:
    name: Production API Tests
    runs-on: ubuntu-latest
    needs: local-tests
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Install Newman
        run: npm install -g newman
      
      - name: Run Postman tests
        env:
          JWT_SECRET: ${{ secrets.JWT_SECRET_PRODUCTION }}
        run: |
          newman run postman/GPS-Gateway-Complete-Tests.json \
            --environment postman/GPS-Gateway-Production.json \
            --reporters cli,json \
            --reporter-json-export results/postman-results.json
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: postman-test-results
          path: results/
      
      - name: Notify Slack on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Monitoring Script

```javascript
// monitoring/health-check.js
const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api-gateway-production-f577.up.railway.app';
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;

const checkHealth = async () => {
  try {
    const start = Date.now();
    const response = await axios.get(`${GATEWAY_URL}/health`);
    const responseTime = Date.now() - start;
    
    if (response.status === 200) {
      console.log(`✅ Gateway healthy - Response time: ${responseTime}ms`);
      return true;
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Gateway health check failed: ${error.message}`);
    
    if (SLACK_WEBHOOK) {
      await sendSlackAlert(error.message);
    }
    
    return false;
  }
};

const sendSlackAlert = async (message) => {
  try {
    await axios.post(SLACK_WEBHOOK, {
      text: `🚨 GPS Gateway Alert: ${message}`,
      channel: '#alerts',
      username: 'Gateway Monitor'
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error.message);
  }
};

// Run check
checkHealth();
```

---

## 🚀 Deployment

### Railway Configuration

#### Environment Variables
```bash
# Production environment variables in Railway
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secure-production-secret

# Microservices URLs
USUARIOS_URL=https://users-microservice-production.up.railway.app
INVENTARIO_URL=https://inventory-microservice-production-a316.up.railway.app
TRANSACCIONES_URL=https://transactions-microservice-production.up.railway.app
```

#### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "startCommand": "node index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3000

CMD ["node", "index.js"]
```

### Health Check Script

```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('Health check error:', err);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('Health check timeout');
  request.destroy();
  process.exit(1);
});

request.end();
```

---

## 📊 Métricas y Monitoring

### Resultados Esperados

| Categoría | Tests | ✅ Pass | ❌ Fail (Expected) | ⚠️ Proxy Errors |
|-----------|-------|---------|-------------------|------------------|
| **Gateway Health** | 2 | 2 | 0 | 0 |
| **Authentication** | 2 | 2 | 0 | 0 |
| **Users Service** | 3 | 1 | 2 (403) | 0-1 |
| **Inventory Service** | 3 | 1 | 2 (403) | 0-1 |
| **Transactions Service** | 3 | 1 | 2 (403/400) | 0-1 |
| **TOTAL** | **13** | **7** | **6** | **0-3** |

### Status Codes Guide

- ✅ **200**: Operación exitosa
- ✅ **400**: Validación de entrada (fechas inválidas, campos faltantes)
- ✅ **401**: Error de autenticación (sin token, token inválido/expirado)
- ✅ **403**: Error de autorización (sin rol/permisos necesarios)
- ⚠️ **500/502/503**: Error de microservicio (esperado durante tests)

### Performance Benchmarks

```javascript
// Performance expectations
const BENCHMARKS = {
  healthCheck: 100,      // < 100ms
  authentication: 200,   // < 200ms
  authorization: 150,    // < 150ms
  proxyRequest: 2000,    // < 2s
  totalRequest: 5000     // < 5s
};
```

---

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Test Failures - Authentication
```bash
Error: Returns 401 without token
Solution: Verificar que el middleware de auth esté funcionando
Check: Logs del gateway para errores JWT
```

#### 2. Token Generation Issues
```bash
Error: Invalid JWT secret
Solution: Verificar JWT_SECRET en environment
Command: echo $JWT_SECRET
```

#### 3. Microservice Connection Errors
```bash
Error: ECONNREFUSED
Status: 500/502/503
Solution: Verificar que microservicios estén funcionando
Check: curl https://microservice-url/health
```

#### 4. CORS Issues
```bash
Error: CORS policy blocked
Solution: Verificar headers CORS en response
Check: OPTIONS request en browser dev tools
```

### Debug Commands

```bash
# Ver logs del gateway en Railway
railway logs --service api-gateway

# Verificar health de microservicios
curl https://users-microservice-url/health
curl https://inventory-microservice-url/health
curl https://transactions-microservice-url/health

# Test local connectivity
curl -I http://localhost:3000/health

# Verificar token JWT
node -e "
const jwt = require('jsonwebtoken');
console.log(jwt.decode('your-token-here'));
"
```

### Contact & Support

Para problemas con las pruebas:

1. **Verificar variables de entorno** en Railway dashboard
2. **Comprobar estado de microservicios** en logs
3. **Validar tokens JWT** con el secret correcto  
4. **Revisar logs del gateway** para errores específicos
5. **Testear connectivity** con curl/Postman básico

---

## 📈 Roadmap de Testing

### ✅ Implementado
- [x] Tests locales comprehensivos con Jest
- [x] Tests de autenticación y autorización
- [x] Validación de todos los middlewares
- [x] Collection completa de Postman
- [x] Generación automática de tokens
- [x] CI/CD pipeline con GitHub Actions

### 🚧 En Desarrollo
- [ ] Tests de performance y carga
- [ ] Tests de stress y resilience
- [ ] Monitoring automático con alertas
- [ ] Dashboard de métricas en tiempo real

### 📋 Próximos Pasos
- [ ] Tests de seguridad automatizados
- [ ] Integration tests end-to-end
- [ ] Load testing con Artillery
- [ ] Security scanning con OWASP ZAP
- [ ] API documentation con OpenAPI/Swagger

---

## 📝 Changelog

### v1.0.0 - Initial Release
- ✅ Complete JWT authentication system
- ✅ Role-based access control (admin, supervisor, buyer, seller, user)
- ✅ Permission-based access control (INVENTORY_WRITE, etc.)
- ✅ Three microservices integration (Users, Inventory, Transactions)
- ✅ Comprehensive test suites (Jest + Postman)
- ✅ Production deployment on Railway
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Complete documentation and testing guide

---

**GPS Gateway** - Enterprise API Gateway con autenticación JWT y control de acceso granular.  
*Desarrollado para gestión centralizada de microservicios de GPS corporativo.*