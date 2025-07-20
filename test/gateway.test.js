const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../index');

describe('GPS Gateway Tests', () => {
  let app;
  const testSecret = 'test-secret';
  
  // Enhanced test tokens with roles and permissions
  const validUserToken = jwt.sign(
    { 
      id: 1, 
      email: 'test@example.com', 
      roles: [{ roleName: 'user' }] 
    }, 
    testSecret,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { 
      id: 2, 
      email: 'admin@example.com', 
      roles: [{ 
        roleName: 'admin',
        permissions: [{ permissionName: 'INVENTORY_WRITE' }]
      }] 
    }, 
    testSecret,
    { expiresIn: '1h' }
  );

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = testSecret;
    process.env.USUARIOS_URL = 'http://localhost:4001';
    process.env.INVENTARIO_URL = 'http://localhost:4002';
    
    app = createApp();
  });

  afterAll(() => {
    delete process.env.NODE_ENV;
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
        .get('/inventario/manage/products')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Should not fail due to permissions (may fail due to proxy)
      expect([200, 500, 502, 503].includes(response.statusCode)).toBe(true);
    });

    test('Should deny access without required permissions', async () => {
      const response = await request(app)
        .get('/inventario/manage/products')
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
});