const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/usuarios', createProxyMiddleware({
  target: process.env.USUARIOS_URL,
  changeOrigin: true,
  pathRewrite: { '^/usuarios': '' }
}));

app.use('/inventario', createProxyMiddleware({
  target: process.env.INVENTARIO_URL,
  changeOrigin: true,
  pathRewrite: { '^/inventario': '' }
}));

// Agrega más microservicios aquí...

app.listen(PORT, () => {
  console.log(`Gateway corriendo en puerto ${PORT}`);
});
