# GPS Gateway

Gateway para microservicios del sistema GPS.

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

## Endpoints

- `GET /health` - Health check
- `/usuarios/*` - Proxy al microservicio de usuarios
- `/inventario/*` - Proxy al microservicio de inventario