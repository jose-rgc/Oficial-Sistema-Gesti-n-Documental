const express = require('express');
const User = require('../models/User');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// Obtener todos los usuarios
// Obtener un usuario por ID
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id, 'username role'); // Buscar el usuario por ID
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user); // Enviar los datos del usuario al frontend
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error al obtener usuario' });
    }
});


// Crear un nuevo usuario
router.post('/', authenticateToken, async (req, res) => {
    const { username, password, role } = req.body;
    const newUser = new User({ username, password, role });
    try {
        await newUser.save();
        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear usuario' });
    }
});

// Editar un usuario
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { username, role } = req.body;
    try {
        const user = await User.findByIdAndUpdate(id, { username, role }, { new: true });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
});

// Eliminar un usuario
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await User.findByIdAndDelete(id);
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
});
// Obtener todos los usuarios
router.get('/', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({}, 'username role'); // Solo devolver 'username' y 'role'
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

module.exports = router;
