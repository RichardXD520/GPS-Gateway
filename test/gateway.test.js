const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../index');

describe('GPS Gateway Tests', () => {
  let app;
  const testSecret = 'test-secret';
  
  // Admin Token
  const adminToken = jwt.sign({
    id: 1,
    email: 'admin@test.com',
    roles: [{
      roleName: 'admin',
      permissions: [{ permissionName: 'INVENTORY_WRITE' }]
    }]
  }, testSecret, { expiresIn: '24h' });

  // User Token
  const validUserToken = jwt.sign(
    { 
      id: 2, 
      email: 'user@test.com', 
      roles: [{ roleName: 'user' }] 
    }, 
    testSecret,
    { expiresIn: '24h' }
  );

  // Buyer Token
  const buyerToken = jwt.sign({
    id: 3,
    email: 'buyer@test.com',
    roles: [{ roleName: 'buyer' }]
  }, testSecret, { expiresIn: '24h' });

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = testSecret;
    process.env.USUARIOS_URL = 'http://localhost:4001';
    process.env.INVENTARIO_URL = 'http://localhost:4002';
    process.env.TRANSACCIONES_URL = 'http://localhost:4003'; // Added missing URL
    
    app = createApp();
  });

  afterAll(() => {
    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
    delete process.env.USUARIOS_URL;
    delete process.env.INVENTARIO_URL;
    delete process.env.TRANSACCIONES_URL;
  });

  describe('Health Check', () => {
    test('GET /health should return 200 and status message', async () => {
      const response = await request(app).get('/health');
      
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('Gateway is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Enhanced JWT Authentication', () => {
    test('Should allow access to public routes without token', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
    });

    test('Should reject protected routes without token - new middleware', async () => {
      const response = await request(app).get('/usuarios/profile');
      
      expect(response.statusCode).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Token de autenticación requerido');
    });

    test('Should allow access with valid token - new middleware', async () => {
      const response = await request(app)
        .get('/usuarios/some-endpoint')
        .set('Authorization', `Bearer ${validUserToken}`);
      
      expect([200, 500, 502, 503].includes(response.statusCode)).toBe(true);
    });

    test('Should reject invalid tokens - new middleware', async () => {
      const response = await request(app)
        .get('/usuarios/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.statusCode).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Token inválido');
    });
  });

  describe('Role-based Access Control', () => {
    test('Should allow admin access to admin routes', async () => {
      const response = await request(app)
        .get('/usuarios/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Should not fail due to authorization (may fail due to proxy)
      expect([200, 500, 502, 503].includes(response.statusCode)).toBe(true);
    });

    test('Should deny user access to admin routes', async () => {
      const response = await request(app)
        .get('/usuarios/admin/users')
        .set('Authorization', `Bearer ${validUserToken}`);
      
      expect(response.statusCode).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('No tiene el rol necesario para acceder a este recurso');
    });
  });

  describe('Permission-based Access Control', () => {
    test('Should allow access with required permissions', async () => {
      const response = await request(app)
        .get('/api/lotes')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Should not fail due to permissions (may fail due to proxy)
      expect([200, 500, 502, 503].includes(response.statusCode)).toBe(true);
    });

    test('Should deny access without required permissions', async () => {
      const response = await request(app)
        .get('/api/lotes')
        .set('Authorization', `Bearer ${validUserToken}`);
      
      expect(response.statusCode).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('No tiene permisos para acceder a este recurso');
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

  describe('Transactions Middleware', () => {
    test('Should allow purchase access for admin', async () => {
      const response = await request(app)
        .get('/api/purchases')
        .set('Authorization', `Bearer ${buyerToken}`);
      
      // Should not fail due to authorization (may fail due to proxy)
      expect([200, 500, 502, 503].includes(response.statusCode)).toBe(true);
    });

    test('Should deny purchase access for regular user', async () => {
      const response = await request(app)
        .get('/api/purchases')
        .set('Authorization', `Bearer ${validUserToken}`);
      
      expect(response.statusCode).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Se requiere rol de buyer, supervisor o admin para acceder a compras'); // Updated message
    });
  });
});