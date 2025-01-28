const express = require('express');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// Obtener todos los funcionarios
router.get('/', authenticateToken, async (req, res) => {
    try {
        const employees = await Employee.find();

        const transformedEmployees = employees.map((employee) => {
            const documents = {};
            if (employee.documents) {
                employee.documents.forEach((value, key) => {
                    documents[key] = value.status; // Solo enviar el estado
                });
            }

            return {
                _id: employee._id,
                ci: employee.ci,
                nombres: employee.nombres,
                apellidos: employee.apellidos,
                cargo: employee.cargo,
                unidad: employee.unidad,
                documents,
            };
        });

        res.json(transformedEmployees);
    } catch (error) {
        console.error('Error al obtener empleados:', error);
        res.status(500).json({ message: 'Error al obtener empleados' });
    }
});


// Obtener un funcionario por ID
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID no válido' });
    }

    try {
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ message: 'Funcionario no encontrado' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener funcionario' });
    }
});

// Crear un nuevo funcionario
router.post('/', authenticateToken, async (req, res) => {
    const { ci, nombres, apellidos, cargo, unidad, fechaInicioContrato, fechaFinContrato } = req.body;

    const newEmployee = new Employee({
        ci,
        nombres,
        apellidos,
        cargo,
        unidad,
        fechaInicioContrato,
        fechaFinContrato
    });

    try {
        await newEmployee.save();
        res.status(201).json({ message: 'Funcionario creado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear funcionario' });
    }
});

// Editar un funcionario
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { ci, nombres, apellidos, cargo, unidad, fechaInicioContrato, fechaFinContrato } = req.body;

    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            { ci, nombres, apellidos, cargo, unidad, fechaInicioContrato, fechaFinContrato },
            { new: true }
        );
        res.json(updatedEmployee);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar funcionario' });
    }
});

// Eliminar un funcionario
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        await Employee.findByIdAndDelete(id);
        res.json({ message: 'Funcionario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar funcionario' });
    }
});

module.exports = router;
