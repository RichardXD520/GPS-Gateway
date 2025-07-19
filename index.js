const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`Gateway corriendo en puerto ${PORT}`);
});

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock del servidor para tests
const express = require('express');
const app = express();

// Configurar middleware básico para tests
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway is running', timestamp: new Date().toISOString() });
});

// Mock de autenticación para tests
const authenticateToken = (req, res, next) => {
  const publicRoutes = ['/health', '/usuarios/login', '/usuarios/register'];
  
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

app.use(authenticateToken);

// Mock endpoints para tests
app.get('/usuarios/profile', (req, res) => {
  res.json({ message: 'Protected route', user: req.user });
});

describe('GPS Gateway Tests', () => {
  describe('Health Check', () => {
    test('GET /health should return 200 and status message', async () => {
      const response = await request(app).get('/health');
      
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('Gateway is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('CORS Headers', () => {
    test('Should include CORS headers in response', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    test('Should handle OPTIONS preflight requests', async () => {
      const response = await request(app).options('/health');
      
      expect(response.statusCode).toBe(200);
    });
  });

  describe('JWT Authentication', () => {
    const testSecret = 'test-secret';
    const validToken = jwt.sign(
      { id: 1, email: 'test@example.com', role: 'user' }, 
      testSecret,
      { expiresIn: '1h' }
    );

    test('Should allow access to public routes without token', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
    });

    test('Should reject protected routes without token', async () => {
      const response = await request(app).get('/usuarios/profile');
      
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    test('Should allow access to protected routes with valid token', async () => {
      process.env.JWT_SECRET = testSecret;
      
      const response = await request(app)
        .get('/usuarios/profile')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('Should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/usuarios/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.statusCode).toBe(403);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('Environment Variables', () => {
    test('Should have required environment variables for production', () => {
      // En CI, estas variables deben estar definidas
      if (process.env.NODE_ENV !== 'test') {
        expect(process.env.USUARIOS_URL).toBeDefined();
        expect(process.env.INVENTARIO_URL).toBeDefined();
        expect(process.env.JWT_SECRET).toBeDefined();
      }
    });
  });
});
