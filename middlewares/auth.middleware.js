const jwt = require('jsonwebtoken');

class AuthMiddleware {
  // Middleware to verify JWT token and set user in request
  verifyToken = (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Token de autenticación requerido'
        });
      }

      // Implement JWT verification
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      
      next();
    } catch (error) {
      res.status(401).json({
        status: 'error',
        message: 'Token inválido',
        error: error.message || 'Error desconocido'
      });
    }
  };

  // Check if user has required permission
  hasPermission = (requiredPermission) => {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            status: 'error',
            message: 'Usuario no autenticado'
          });
        }

        const userPermissions = this.getUserPermissions(req.user);
        
        if (!userPermissions.includes(requiredPermission)) {
          return res.status(403).json({
            status: 'error',
            message: 'No tiene permisos para acceder a este recurso'
          });
        }
        
        next();
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Error al verificar permisos',
          error: error.message || 'Error desconocido'
        });
      }
    };
  };

  // Check if user has any of the required roles
  hasRole = (requiredRoles) => {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            status: 'error',
            message: 'Usuario no autenticado'
          });
        }

        const userRoles = req.user.roles?.map(role => role.roleName) || [];
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
        
        if (!hasRequiredRole) {
          return res.status(403).json({
            status: 'error',
            message: 'No tiene el rol necesario para acceder a este recurso'
          });
        }
        
        next();
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Error al verificar rol',
          error: error.message || 'Error desconocido'
        });
      }
    };
  };

  // Helper method to get user permissions
  getUserPermissions(user) {
    const permissions = [];
    if (user.roles) {
      user.roles.forEach(role => {
        if (role.permissions) {
          role.permissions.forEach(permission => {
            permissions.push(permission.permissionName);
          });
        }
      });
    }
    return permissions;
  }
}

module.exports = { AuthMiddleware };