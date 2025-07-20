const { checkPermissions } = require('./permissions.middleware');

class InventoryMiddleware {
  // Middleware para operaciones de lectura de inventario
  validateInventoryRead = (req, res, next) => {
    try {
      // Cualquier usuario autenticado puede leer inventario
      console.log(`Inventory read access: ${req.user.email} accessing ${req.originalUrl}`);
      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error validando acceso de lectura a inventario',
        error: error.message
      });
    }
  };

  // Middleware para operaciones de escritura de inventario
  validateInventoryWrite = checkPermissions(['INVENTORY_WRITE']);

  // Middleware para gestión de bodegas
  validateWarehouseAccess = (req, res, next) => {
    try {
      const { method } = req;
      const userRoles = req.user.roles?.map(role => role.roleName) || [];
      
      // Solo supervisores y admins pueden modificar bodegas
      if (['POST', 'PUT', 'DELETE'].includes(method)) {
        if (!userRoles.includes('supervisor') && !userRoles.includes('admin')) {
          return res.status(403).json({
            status: 'error',
            message: 'Se requiere rol de supervisor o admin para modificar bodegas'
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error validando acceso a bodegas',
        error: error.message
      });
    }
  };

  // Validación específica para lotes
  validateBatchAccess = (req, res, next) => {
    try {
      const { method, body } = req;
      
      // Validaciones específicas para creación de lotes
      if (method === 'POST') {
        if (!body.productId || !body.quantity) {
          return res.status(400).json({
            status: 'error',
            message: 'ProductId y quantity son requeridos para crear un lote'
          });
        }
      }

      console.log(`Batch operation: ${method} by ${req.user.email}`);
      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error validando acceso a lotes',
        error: error.message
      });
    }
  };
}

module.exports = { InventoryMiddleware };