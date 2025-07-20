const { AuthMiddleware } = require('./auth.middleware');
const { checkPermissions } = require('./permissions.middleware');

class UsersMiddleware {
  constructor() {
    this.authMiddleware = new AuthMiddleware();
  }

  // Middleware específico para gestión de usuarios
  validateUserAccess = (req, res, next) => {
    try {
      const { method, path } = req;
      const userId = req.params.id;
      const currentUser = req.user;

      // Los usuarios pueden ver/editar solo su propia información
      // Los admins pueden hacer todo
      if (userId && method !== 'POST') {
        const isOwner = currentUser.id == userId;
        const isAdmin = currentUser.roles?.some(role => role.roleName === 'admin');
        
        if (!isOwner && !isAdmin) {
          return res.status(403).json({
            status: 'error',
            message: 'Solo puedes acceder a tu propia información'
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error validando acceso de usuario',
        error: error.message
      });
    }
  };

  // Validación para crear usuarios
  validateUserCreation = (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email y password son requeridos'
        });
      }

      // Log de creación de usuario
      console.log(`User creation attempt: ${email} by ${req.user?.email || 'anonymous'}`);
      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error validando creación de usuario',
        error: error.message
      });
    }
  };
}

module.exports = { UsersMiddleware };