const { checkPermissions } = require('./permissions.middleware');

class TransactionsMiddleware {
  // Middleware para validar acceso a compras
  validatePurchaseAccess = (req, res, next) => {
    try {
      const { method, params } = req;
      const userRoles = req.user.roles?.map(role => role.roleName) || [];
      
      // Solo buyers, supervisors y admins pueden crear/modificar compras
      if (['POST', 'PUT', 'DELETE'].includes(method)) {
        const canModifyPurchases = userRoles.some(role => 
          ['buyer', 'supervisor', 'admin'].includes(role)
        );
        
        if (!canModifyPurchases) {
          return res.status(403).json({
            status: 'error',
            message: 'Se requiere rol de buyer, supervisor o admin para modificar compras'
          });
        }
      }

      // Log de acceso a compras
      console.log(`Purchase access: ${method} ${req.originalUrl} by ${req.user.email}`);
      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error validando acceso a compras',
        error: error.message
      });
    }
  };

  // Middleware para validar acceso a ventas
  validateSalesAccess = (req, res, next) => {
    try {
      const { method, params } = req;
      const userRoles = req.user.roles?.map(role => role.roleName) || [];
      
      // Solo sellers, supervisors y admins pueden crear/modificar ventas
      if (['POST', 'PUT', 'DELETE'].includes(method)) {
        const canModifySales = userRoles.some(role => 
          ['seller', 'supervisor', 'admin'].includes(role)
        );
        
        if (!canModifySales) {
          return res.status(403).json({
            status: 'error',
            message: 'Se requiere rol de seller, supervisor o admin para modificar ventas'
          });
        }
      }

      console.log(`Sales access: ${method} ${req.originalUrl} by ${req.user.email}`);
      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error validando acceso a ventas',
        error: error.message
      });
    }
  };

  // Middleware para validar búsquedas por RUT
  validateRutAccess = (req, res, next) => {
    try {
      const { rut } = req.params;
      const currentUser = req.user;
      const userRoles = currentUser.roles?.map(role => role.roleName) || [];
      
      // Los usuarios solo pueden ver sus propias transacciones (por RUT)
      // Los supervisores y admins pueden ver todas
      const canViewAllRuts = userRoles.some(role => 
        ['supervisor', 'admin'].includes(role)
      );
      
      if (!canViewAllRuts && currentUser.rut !== rut) {
        return res.status(403).json({
          status: 'error',
          message: 'Solo puedes acceder a tus propias transacciones'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error validando acceso por RUT',
        error: error.message
      });
    }
  };

  // Validación para búsquedas por fecha
  validateDateRangeAccess = (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start > end) {
          return res.status(400).json({
            status: 'error',
            message: 'La fecha de inicio debe ser anterior a la fecha de fin'
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error validando rango de fechas',
        error: error.message
      });
    }
  };
}

module.exports = { TransactionsMiddleware };