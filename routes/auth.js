const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

//  Ruta de inicio de sesión
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            'your_secret_key',
            { expiresIn: '1h' }
        );

        res.json({ token, message: 'Inicio de sesión exitoso' });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});
// Register route (solo para pruebas, eliminar después)
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    const newUser = new User({ username, password, role });
    try {
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
});

module.exports = router;
