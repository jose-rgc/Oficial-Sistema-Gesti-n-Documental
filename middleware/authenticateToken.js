const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'Acceso denegado' });

    // Extraer el token omitiendo 'Bearer'
    const token = authHeader.split(' ')[1];

    try {
        const verified = jwt.verify(token, 'your_secret_key'); // Verificar el token
        req.user = verified;
        next();
    } catch (err) {
        console.error('Error de verificación del token:', err); // Log para depuración
        res.status(403).json({ message: 'Token inválido' }); // Cambiar el código de estado a 403 para errores de autenticación
    }
};

module.exports = authenticateToken;


