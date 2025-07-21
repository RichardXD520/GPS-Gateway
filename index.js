const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const { AuthMiddleware } = require('./middlewares/auth.middleware');
const { checkPermissions } = require('./middlewares/permissions.middleware');
const { UsersMiddleware } = require('./middlewares/users.middleware');
const { InventoryMiddleware } = require('./middlewares/inventory.middleware');
const { TransactionsMiddleware } = require('./middlewares/transactions.middleware');
require('dotenv').config();

const createApp = () => {
  const app = express();
  const authMiddleware = new AuthMiddleware();
  const usersMiddleware = new UsersMiddleware();
  const inventoryMiddleware = new InventoryMiddleware();
  const transactionsMiddleware = new TransactionsMiddleware();

  // Middleware básico
  app.use(express.json());
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Rutas públicas
  const publicRoutes = ['/health', '/usuarios/login', '/usuarios/register', '/hola'];
  
  app.use((req, res, next) => {
    if (publicRoutes.includes(req.path)) {
      return next();
    }
    return authMiddleware.verifyToken(req, res, next);
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'Gateway is running', timestamp: new Date().toISOString() });
  });

  // Proxy options
  const proxyOptions = {
    changeOrigin: true,
    timeout: 10000,
    onError: (err, req, res) => {
      console.error(`Proxy error: ${err.message}`);
      res.status(500).json({ 
        status: 'error',
        message: 'Service temporarily unavailable',
        service: req.originalUrl.split('/')[1]
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Role', JSON.stringify(req.user.roles || []));
        proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions || []));
        proxyReq.setHeader('X-Gateway-Source', 'gps-gateway');
        proxyReq.setHeader('X-Request-Timestamp', new Date().toISOString());
      }
    }
  };

  // ============= USERS MICROSERVICE =============
  
  // Admin routes for users (requires admin role)
  app.use('/usuarios/admin', 
    authMiddleware.hasRole(['admin']),
    createProxyMiddleware({
      target: process.env.USUARIOS_URL,
      pathRewrite: { '^/usuarios/admin': '/admin' },
      ...proxyOptions
    })
  );

  // Role management (admin only)
  app.use('/api/roles',
    authMiddleware.hasRole(['admin']),
    createProxyMiddleware({
      target: process.env.USUARIOS_URL,
      pathRewrite: { '^/api/roles': '/api/roles' },
      ...proxyOptions
    })
  );

  // Permission management (admin only)
  app.use('/api/permissions',
    authMiddleware.hasRole(['admin']),
    createProxyMiddleware({
      target: process.env.USUARIOS_URL,
      pathRewrite: { '^/api/permissions': '/api/permissions' },
      ...proxyOptions
    })
  );

  // Public user routes (login, register) - no authentication required
  app.use('/usuarios/login',
    createProxyMiddleware({
      target: process.env.USUARIOS_URL,
      pathRewrite: { '^/usuarios/login': '/api/usuarios/login' },
      ...proxyOptions
    })
  );

  app.use('/usuarios/register',
    createProxyMiddleware({
      target: process.env.USUARIOS_URL,
      pathRewrite: { '^/usuarios/register': '/api/usuarios/register' },
      ...proxyOptions
    })
  );

  // Protected user management routes with specific validation
  app.use('/usuarios',
    usersMiddleware.validateUserAccess,
    createProxyMiddleware({
      target: process.env.USUARIOS_URL,
      pathRewrite: { '^/usuarios': '/api/usuarios' },
      ...proxyOptions
    })
  );

  // Beneficiary management
  app.use('/beneficiarios',
    authMiddleware.hasRole(['admin', 'supervisor']),
    createProxyMiddleware({
      target: process.env.USUARIOS_URL,
      pathRewrite: { '^/beneficiarios': '/api/beneficiarios' },
      ...proxyOptions
    })
  );

  // ============= INVENTORY MICROSERVICE =============

  // Warehouse management (supervisor/admin only for modifications)
  app.use('/api/bodegas',
    inventoryMiddleware.validateWarehouseAccess,
    createProxyMiddleware({
      target: process.env.INVENTARIO_URL,
      pathRewrite: { '^/api/bodegas': '/api/bodegas' },
      ...proxyOptions
    })
  );

  // Batch management
  app.use('/api/lotes',
    inventoryMiddleware.validateBatchAccess,
    inventoryMiddleware.validateInventoryWrite,
    createProxyMiddleware({
      target: process.env.INVENTARIO_URL,
      pathRewrite: { '^/api/lotes': '/api/lotes' },
      ...proxyOptions
    })
  );

  // Product management
  app.use('/api/productos',
    inventoryMiddleware.validateInventoryRead,
    createProxyMiddleware({
      target: process.env.INVENTARIO_URL,
      pathRewrite: { '^/api/productos': '/api/productos' },
      ...proxyOptions
    })
  );

  // ============= TRANSACTIONS MICROSERVICE =============

  // Purchase transactions with RUT validation
  app.use('/api/purchases/person/:rut',
    transactionsMiddleware.validateRutAccess,
    transactionsMiddleware.validatePurchaseAccess,
    createProxyMiddleware({
      target: process.env.TRANSACCIONES_URL,
      pathRewrite: { '^/api/purchases': '/api/purchases' },
      ...proxyOptions
    })
  );

  // Purchase transactions with date range
  app.use('/api/purchases/date-range',
    transactionsMiddleware.validateDateRangeAccess,
    transactionsMiddleware.validatePurchaseAccess,
    createProxyMiddleware({
      target: process.env.TRANSACCIONES_URL,
      pathRewrite: { '^/api/purchases': '/api/purchases' },
      ...proxyOptions
    })
  );

  // General purchase transactions
  app.use('/api/purchases',
    transactionsMiddleware.validatePurchaseAccess,
    createProxyMiddleware({
      target: process.env.TRANSACCIONES_URL,
      pathRewrite: { '^/api/purchases': '/api/purchases' },
      ...proxyOptions
    })
  );

  // Sales transactions with RUT validation
  app.use('/api/sales/person/:rut',
    transactionsMiddleware.validateRutAccess,
    transactionsMiddleware.validateSalesAccess,
    createProxyMiddleware({
      target: process.env.TRANSACCIONES_URL,
      pathRewrite: { '^/api/sales': '/api/sales' },
      ...proxyOptions
    })
  );

  // Sales transactions with date range
  app.use('/api/sales/date-range',
    transactionsMiddleware.validateDateRangeAccess,
    transactionsMiddleware.validateSalesAccess,
    createProxyMiddleware({
      target: process.env.TRANSACCIONES_URL,
      pathRewrite: { '^/api/sales': '/api/sales' },
      ...proxyOptions
    })
  );

  // General sales transactions
  app.use('/api/sales',
    transactionsMiddleware.validateSalesAccess,
    createProxyMiddleware({
      target: process.env.TRANSACCIONES_URL,
      pathRewrite: { '^/api/sales': '/api/sales' },
      ...proxyOptions
    })
  );

  return app;
};

if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`Gateway corriendo en puerto ${PORT}`);
  });
}

module.exports = createApp;
