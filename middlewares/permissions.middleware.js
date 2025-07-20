const checkPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Usuario no autenticado' 
      });
    }

    // Get all permissions from user's roles
    const userPermissions = [];
    if (req.user.roles) {
      req.user.roles.forEach(role => {
        if (role.permissions) {
          role.permissions.forEach(permission => {
            userPermissions.push(permission.permissionName);
          });
        }
      });
    }

    const hasPermission = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        status: 'error',
        message: 'No tiene permisos para acceder a este recurso' 
      });
    }

    next();
  };
};

module.exports = { checkPermissions };