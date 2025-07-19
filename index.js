const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const createApp = () => {
  const app = express();

  // Middleware para logging y CORS
  app.use(express.json());
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Manejar preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Middleware de autenticación JWT
  const authenticateToken = (req, res, next) => {
    // Rutas públicas que no requieren autenticación
    const publicRoutes = ['/health', '/usuarios/login', '/usuarios/register'];
    
    if (publicRoutes.includes(req.path)) {
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  };

  // Aplicar autenticación a todas las rutas excepto las públicas
  app.use(authenticateToken);

  // Health check endpoint (público)
  app.get('/health', (req, res) => {
    res.json({ status: 'Gateway is running', timestamp: new Date().toISOString() });
  });

  // Configuración de proxies con manejo de errores
  const proxyOptions = {
    changeOrigin: true,
    timeout: 10000,
    onError: (err, req, res) => {
      console.error(`Proxy error: ${err.message}`);
      res.status(500).json({ error: 'Service temporarily unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Pasar información del usuario autenticado a los microservicios
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    }
  };

  app.use('/usuarios', createProxyMiddleware({
    target: process.env.USUARIOS_URL,
    pathRewrite: { '^/usuarios': '' },
    ...proxyOptions
  }));

  app.use('/inventario', createProxyMiddleware({
    target: process.env.INVENTARIO_URL,
    pathRewrite: { '^/inventario': '' },
    ...proxyOptions
  }));

  // Agrega más microservicios aquí...

  return app;
};

// Solo iniciar el servidor si este archivo se ejecuta directamente
if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`Gateway corriendo en puerto ${PORT}`);
  });
}

module.exports = createApp;
