# GPS Gateway API Documentation

A microservices gateway for GPS (Gestión de Productos y Servicios) system that provides centralized authentication, authorization, and routing to various microservices.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Roles and Permissions](#roles-and-permissions)
- [API Endpoints](#api-endpoints)
  - [Public Endpoints](#public-endpoints)
  - [User Management](#user-management)
  - [Inventory Management](#inventory-management)
  - [Transaction Management](#transaction-management)
- [Environment Variables](#environment-variables)
- [Installation and Setup](#installation-and-setup)
- [Usage Examples](#usage-examples)

## Overview

The GPS Gateway acts as a reverse proxy and API gateway for the following microservices:
- **Users Service** (`USUARIOS_URL`): User management, authentication, roles, and permissions
- **Inventory Service** (`INVENTARIO_URL`): Product, warehouse, and batch management
- **Transactions Service** (`TRANSACCIONES_URL`): Purchase and sales transaction management

## Authentication

All endpoints (except public ones) require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The gateway automatically forwards user information to microservices via headers:
- `X-User-Id`: User ID
- `X-User-Email`: User email
- `X-User-Role`: User roles (JSON array)
- `X-User-Permissions`: User permissions (JSON array)
- `X-Gateway-Source`: Gateway identifier
- `X-Request-Timestamp`: Request timestamp

## Roles and Permissions

### Available Roles
- **admin**: Full system access
- **supervisor**: Management access to all modules
- **buyer**: Purchase transaction access
- **seller**: Sales transaction access
- **user**: Basic user access

### Key Permissions
- `INVENTORY_WRITE`: Can modify inventory data
- Various role-based permissions managed by the Users service

## API Endpoints

### Public Endpoints

These endpoints don't require authentication:

#### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "Gateway is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### User Authentication
```http
POST /usuarios/login
POST /usuarios/register
GET /hola
```

### User Management

#### Admin User Management
```http
# All admin routes require admin role
GET    /usuarios/admin
POST   /usuarios/admin
PUT    /usuarios/admin/:id
DELETE /usuarios/admin/:id
```

#### Role Management
```http
# Admin only
GET    /api/roles
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id
```

#### Permission Management
```http
# Admin only
GET    /api/permissions
POST   /api/permissions
PUT    /api/permissions/:id
DELETE /api/permissions/:id
```

#### User Management
```http
# Users can only access their own data, admins can access all
GET    /usuarios
POST   /usuarios
GET    /usuarios/:id
PUT    /usuarios/:id
DELETE /usuarios/:id
```

#### Beneficiary Management
```http
# Requires admin or supervisor role
GET    /beneficiarios
POST   /beneficiarios
GET    /beneficiarios/:id
PUT    /beneficiarios/:id
DELETE /beneficiarios/:id
```

### Inventory Management

#### Warehouse Management
```http
# Read access for all authenticated users
# Write access requires supervisor or admin role
GET    /api/bodegas
POST   /api/bodegas
GET    /api/bodegas/:id
PUT    /api/bodegas/:id
DELETE /api/bodegas/:id
```

#### Batch Management
```http
# Requires INVENTORY_WRITE permission
GET    /api/lotes
POST   /api/lotes
GET    /api/lotes/:id
PUT    /api/lotes/:id
DELETE /api/lotes/:id
```

**Required fields for batch creation:**
- `productId`: Product identifier
- `quantity`: Batch quantity

#### Product Management
```http
# Read access for all authenticated users
GET    /api/productos
POST   /api/productos
GET    /api/productos/:id
PUT    /api/productos/:id
DELETE /api/productos/:id
```

### Transaction Management

#### Purchase Transactions

**General Purchase Endpoints**
```http
# Requires buyer, supervisor, or admin role
GET    /api/purchases
POST   /api/purchases
GET    /api/purchases/:id
PUT    /api/purchases/:id
DELETE /api/purchases/:id
```

**Purchase by RUT**
```http
# Users can only see their own transactions by RUT
# Supervisors and admins can see all
GET    /api/purchases/person/:rut
```

**Purchase by Date Range**
```http
# Requires buyer, supervisor, or admin role
GET    /api/purchases/date-range?startDate=2024-01-01&endDate=2024-01-31
```

#### Sales Transactions

**General Sales Endpoints**
```http
# Requires seller, supervisor, or admin role
GET    /api/sales
POST   /api/sales
GET    /api/sales/:id
PUT    /api/sales/:id
DELETE /api/sales/:id
```

**Sales by RUT**
```http
# Users can only see their own transactions by RUT
# Supervisors and admins can see all
GET    /api/sales/person/:rut
```

**Sales by Date Range**
```http
# Requires seller, supervisor, or admin role
GET    /api/sales/date-range?startDate=2024-01-01&endDate=2024-01-31
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
JWT_SECRET=your-secret-key

# Microservice URLs
USUARIOS_URL=http://localhost:3001
INVENTARIO_URL=http://localhost:3002
TRANSACCIONES_URL=http://localhost:3003
```

## Installation and Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the gateway:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

4. **Run tests:**
```bash
npm test
```

## Usage Examples

### Authentication Flow

1. **Register a new user:**
```bash
curl -X POST http://localhost:3000/usuarios/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

2. **Login to get JWT token:**
```bash
curl -X POST http://localhost:3000/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

3. **Use the token for authenticated requests:**
```bash
curl -X GET http://localhost:3000/api/productos \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Inventory Operations

**Create a warehouse (requires supervisor/admin role):**
```bash
curl -X POST http://localhost:3000/api/bodegas \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bodega Central",
    "location": "Santiago",
    "capacity": 1000
  }'
```

**Create a batch (requires INVENTORY_WRITE permission):**
```bash
curl -X POST http://localhost:3000/api/lotes \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PROD001",
    "quantity": 100,
    "expiryDate": "2024-12-31"
  }'
```

### Transaction Operations

**Create a purchase (requires buyer role):**
```bash
curl -X POST http://localhost:3000/api/purchases \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "SUPP001",
    "productId": "PROD001",
    "quantity": 50,
    "unitPrice": 10.50
  }'
```

**Get sales by date range (requires seller role):**
```bash
curl -X GET "http://localhost:3000/api/sales/date-range?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Error Handling

The gateway returns standardized error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based authorization
- Request logging and monitoring
- CORS support
- Input validation and sanitization
- Secure headers forwarding

## Development

The gateway is built with:
- **Node.js** and **Express.js**
- **http-proxy-middleware** for reverse proxy functionality
- **jsonwebtoken** for JWT handling
- **Jest** for testing

For development, use `npm run dev` to start with auto-reload enabled.