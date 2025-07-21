const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const { AuthMiddleware } = require('./middlewares/auth.middleware');
const { checkPermissions } = require('./middlewares/permissions.middleware');
const { UsersMiddleware } = require('./middlewares/users.middleware');
const { InventoryMiddleware } = require('./middlewares/inventory.middleware');
const { TransactionsMiddleware } = require('./middlewares/transactions.middleware');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Fallback environment variables if .env is not loaded
if (!process.env.USUARIOS_URL) {
  process.env.USUARIOS_URL = 'https://users-microservice-production.up.railway.app';
  process.env.INVENTARIO_URL = 'https://inventario-gps-production.up.railway.app';
  process.env.TRANSACCIONES_URL = 'https://inventory-microservice-production-a316.up.railway.app';
  process.env.FRONTUSERLIST_URL = 'https://frontuserslist-production.up.railway.app';
  console.log('Using fallback environment variables');
}

const createApp = () => {
  // Debug: Log environment variables
  console.log('Environment variables:');
  console.log('USUARIOS_URL:', process.env.USUARIOS_URL);
  console.log('INVENTARIO_URL:', process.env.INVENTARIO_URL);
  console.log('TRANSACCIONES_URL:', process.env.TRANSACCIONES_URL);
  console.log('FRONTUSERLIST_URL:', process.env.FRONTUSERLIST_URL);
  
  const app = express();
  const authMiddleware = new AuthMiddleware();
  const usersMiddleware = new UsersMiddleware();
  const inventoryMiddleware = new InventoryMiddleware();
  const transactionsMiddleware = new TransactionsMiddleware();

  // Middleware básico
  app.use(express.json());
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
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
  const publicRoutes = ['/health', '/usuarios/login', '/usuarios/register', '/hola', '/test', '/deployment-test'];
  
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

  // Test endpoint to check if the issue is with the proxy
  app.post('/test', (req, res) => {
    console.log('Test endpoint - Request body:', req.body);
    res.json({ 
      status: 'success', 
      message: 'Test endpoint working',
      receivedBody: req.body 
    });
  });

  // Deployment verification endpoint
  app.get('/deployment-test', (req, res) => {
    res.json({
      status: 'success',
      message: 'Deployment verification endpoint',
      deploymentId: 'v2.1.0-fixed-502-errors',
      timestamp: new Date().toISOString(),
      features: [
        'Custom HTTPS proxy for registration',
        'Field transformation (email -> username)',
        'Fallback environment variables',
        'Enhanced error handling'
      ],
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        usuariosUrl: process.env.USUARIOS_URL ? 'SET' : 'NOT SET',
        inventarioUrl: process.env.INVENTARIO_URL ? 'SET' : 'NOT SET',
        transaccionesUrl: process.env.TRANSACCIONES_URL ? 'SET' : 'NOT SET'
      }
    });
  });

  // Proxy options
  const proxyOptions = {
    changeOrigin: true,
    timeout: 30000, // Increased timeout to 30 seconds
    onError: (err, req, res) => {
      console.error(`Proxy error: ${err.message}`);
      console.error(`Request URL: ${req.originalUrl}`);
      console.error(`Request method: ${req.method}`);
      res.status(500).json({ 
        status: 'error',
        message: 'Service temporarily unavailable',
        service: req.originalUrl.split('/')[1]
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Siempre enviar el token Authorization si existe
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
        console.log('Forwarding Authorization header to microservice');
      }
      
      // Enviar info del usuario si está disponible
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

  // Middleware to transform email to username for login and registration
  app.use('/usuarios/login', (req, res, next) => {
    console.log('Login middleware - Original body:', req.body);
    if (req.body && req.body.email) {
      req.body.username = req.body.email;
      delete req.body.email;
      console.log('Login middleware - Transformed body:', req.body);
    }
    next();
  });

  app.use('/usuarios/register', (req, res, next) => {
    console.log('Register middleware - Original body:', req.body);
    if (req.body && req.body.email) {
      req.body.username = req.body.email;
      delete req.body.email;
      console.log('Register middleware - Transformed body:', req.body);
    }
    next();
  });

  // Public user routes (login, register) - no authentication required
  app.use('/usuarios/login',
    createProxyMiddleware({
      target: process.env.USUARIOS_URL,
      pathRewrite: { '^/usuarios/login': '/api/usuarios/login' },
      ...proxyOptions
    })
  );

  // Simple proxy for registration endpoint
  app.use('/usuarios/register', (req, res) => {
    console.log('Register endpoint - Request body:', req.body);
    
    const https = require('https');
    const url = require('url');
    
    const targetUrl = url.parse(process.env.USUARIOS_URL + '/api/usuarios/register');
    
    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || 443,
      path: targetUrl.path,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(req.body))
      }
    };
    
    const proxyReq = https.request(options, (proxyRes) => {
      console.log('Proxy response status:', proxyRes.statusCode);
      
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (error) => {
      console.error('Proxy error:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Service temporarily unavailable'
      });
    });
    
    proxyReq.write(JSON.stringify(req.body));
    proxyReq.end();
  });

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
