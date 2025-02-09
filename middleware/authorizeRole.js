const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acceso denegado: No tienes permiso para esta acción.' });
        }
        next();
    };
};

module.exports = authorizeRole;
