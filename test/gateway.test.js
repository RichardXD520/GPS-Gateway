const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../index'); // Importar tu aplicación real

describe('GPS Gateway Tests', () => {
  let app;
  const testSecret = 'test-secret';
  const validToken = jwt.sign(
    { id: 1, email: 'test@example.com', role: 'user' }, 
    testSecret,
    { expiresIn: '1h' }
  );

  beforeAll(() => {
    // Configurar variables de entorno para tests
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = testSecret;
    process.env.USUARIOS_URL = 'http://localhost:4001';
    process.env.INVENTARIO_URL = 'http://localhost:4002';
    
    // Crear la aplicación usando tu función real
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

    test('Should reject protected routes without token', async () => {
      const response = await request(app).get('/usuarios/profile');
      
      expect(response.statusCode).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    test('Should allow access to protected routes with valid token', async () => {
      const response = await request(app)
        .get('/usuarios/some-endpoint')
        .set('Authorization', `Bearer ${validToken}`);
      
      // Esto fallará con error de proxy, pero eso está bien para tests unitarios
      // Lo importante es que la autenticación funcione
      expect([200, 500, 502, 503].includes(response.statusCode)).toBe(true);
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

  describe('Environment Variables', () => {
    test('Should have JWT_SECRET defined', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
    });

    test('Should have microservice URLs defined', () => {
      expect(process.env.USUARIOS_URL).toBeDefined();
      expect(process.env.INVENTARIO_URL).toBeDefined();
    });
  });
});