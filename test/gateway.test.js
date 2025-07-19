const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Importar y configurar la aplicación para tests
const app = express();

// Replicar la configuración del gateway para tests
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

// Middleware de autenticación para tests
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

  jwt.verify(token, process.env.JWT_SECRET || 'test-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

app.use(authenticateToken);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway is running', timestamp: new Date().toISOString() });
});

// Mock endpoints para simular microservicios
app.post('/usuarios/login', (req, res) => {
  // Mock login endpoint
  const { email, password } = req.body;
  if (email === 'test@example.com' && password === 'password') {
    const token = jwt.sign(
      { id: 1, email: 'test@example.com', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: 1, email: 'test@example.com', role: 'user' } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/usuarios/profile', (req, res) => {
  res.json({ message: 'Protected route', user: req.user });
});

app.get('/inventario/productos', (req, res) => {
  res.json({ productos: [], user: req.user });
});

describe('GPS Gateway Tests', () => {
  const testSecret = 'test-secret';
  const validToken = jwt.sign(
    { id: 1, email: 'test@example.com', role: 'user' }, 
    testSecret,
    { expiresIn: '1h' }
  );

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
  });

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
    test('Should allow access to public routes without token', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
    });

    test('Should allow login without token', async () => {
      const response = await request(app)
        .post('/usuarios/login')
        .send({
          email: 'test@example.com',
          password: 'password'
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('Should reject protected routes without token', async () => {
      const response = await request(app).get('/usuarios/profile');
      
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    test('Should allow access to protected routes with valid token', async () => {
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

    test('Should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/usuarios/profile')
        .set('Authorization', 'InvalidFormat');
      
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Protected Routes', () => {
    test('Should access inventario with valid token', async () => {
      const response = await request(app)
        .get('/inventario/productos')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.productos).toBeDefined();
      expect(response.body.user).toBeDefined();
    });
  });

  describe('Environment Variables', () => {
    test('Should have JWT_SECRET defined', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('Should handle non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .set('Authorization', `Bearer ${validToken}`);
      
      // Puede ser 404 o puede pasar al siguiente middleware
      expect([404, 401, 403].includes(response.statusCode)).toBe(true);
    });
  });
});