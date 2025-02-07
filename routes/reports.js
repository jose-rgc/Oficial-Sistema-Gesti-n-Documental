const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee'); // Importar modelo de empleados

// Ruta para obtener documentos incompletos de una unidad específica y un documento específico
router.get('/documents', async (req, res) => {
    try {
        const { unidad, documento } = req.query;

        console.log('📌 Unidad recibida:', unidad);
        console.log('📌 Documento recibido:', documento);

        const query = unidad ? { unidad } : {};
        console.log('🔍 Query usada:', JSON.stringify(query, null, 2));

        const employees = await Employee.find(query);
        
        console.log('👥 Funcionarios encontrados:', employees.length);

        const reportData = [];

        employees.forEach((employee) => {
            console.log(`📂 Documentos de ${employee.nombres} ${employee.apellidos}:`, employee.documents);

            if (employee.documents) {
                // Convertir el Map en un objeto plano
                const documentsObject = Object.fromEntries(employee.documents);

                Object.entries(documentsObject).forEach(([docName, docData]) => {
                    console.log(`🔎 Revisando documento: ${docName}, Estado: ${docData.status}`);

                    // Filtrar por documento si está especificado
                    if (documento && docName !== documento) {
                        return;
                    }

                    // Solo agregar documentos con estado 'Pendiente' o 'No Presento'
                    if (docData.status === "Pendiente" || docData.status === "No Presento") {
                        reportData.push({
                            funcionario: {
                                nombres: employee.nombres,
                                apellidos: employee.apellidos,
                                unidad: employee.unidad
                            },
                            documento: docName,
                            estado: docData.status
                        });
                    }
                });
            }
        });

        console.log('📋 Datos enviados al frontend:', reportData);
        res.json(reportData);
    } catch (error) {
        console.error('❌ Error al obtener el reporte:', error);
        res.status(500).json({ message: 'Error al obtener el reporte' });
    }
});

module.exports = router;
