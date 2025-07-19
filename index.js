const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
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

// Health check endpoint
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
