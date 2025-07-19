# GPS Gateway

Gateway para microservicios del sistema GPS con autenticación JWT.

## Instalación

```bash
npm install


```

## Uso

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Variables de Entorno

- `PORT`: Puerto del servidor (default: 3000)
- `USUARIOS_URL`: URL del microservicio de usuarios
- `INVENTARIO_URL`: URL del microservicio de inventario
- `JWT_SECRET`: Clave secreta para JWT (requerida en producción)

## Endpoints

### Públicos (no requieren autenticación)
- `GET /health` - Health check del gateway
- `POST /usuarios/login` - Login de usuarios
- `POST /usuarios/register` - Registro de usuarios

### Protegidos (requieren JWT token)
- `/usuarios/*` - Proxy al microservicio de usuarios
- `/inventario/*` - Proxy al microservicio de inventario

## Autenticación JWT

El gateway implementa autenticación JWT centralizada:

### Uso de tokens
```bash
# Obtener token (desde el microservicio de usuarios)
curl -X POST https://tu-gateway.up.railway.app/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Usar token en requests protegidos
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://tu-gateway.up.railway.app/inventario/productos
```

### Headers enviados a microservicios
El gateway automáticamente envía información del usuario autenticado:
- `X-User-Id`: ID del usuario
- `X-User-Email`: Email del usuario  
- `X-User-Role`: Rol del usuario

## Características

- ✅ CORS configurado
- ✅ Autenticación JWT centralizada
- ✅ Logging de requests
- ✅ Health checks
- ✅ Manejo de errores
- ✅ Despliegue automático con Docker
- ✅ CI/CD con GitHub Actions
- ✅ Propagación de datos de usuario a microservicios

## Agregar nuevos microservicios

Para agregar un nuevo microservicio protegido:

```js
app.use('/nuevo-servicio', createProxyMiddleware({
  target: process.env.NUEVO_SERVICIO_URL,
  pathRewrite: { '^/nuevo-servicio': '' },
  ...proxyOptions
}));
```

Y agrega la variable de entorno correspondiente.

## Rutas públicas

Para agregar rutas que no requieran autenticación, modifica el array `publicRoutes` en `index.js`:

```js
const publicRoutes = ['/health', '/usuarios/login', '/usuarios/register', '/nueva-ruta-publica'];
```