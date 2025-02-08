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
                            estado: docData.status,
                            fechaLimite: docData.dueDate ? new Date(docData.dueDate).toLocaleDateString() : "No definida"
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
// Ruta para obtener estadísticas de documentos incompletos
router.get('/statistics', async (req, res) => {
    try {
        console.log("📊 Generando estadísticas de documentos incompletos...");

        const employees = await Employee.find();

        let statsByUnit = {};
        let statsByDocument = {};

        employees.forEach((employee) => {
            if (employee.documents) {
                const documentsObject = Object.fromEntries(employee.documents);

                Object.entries(documentsObject).forEach(([docName, docData]) => {
                    if (docData.status === "Pendiente" || docData.status === "No Presento") {
                        
                        // Contar por unidad
                        if (!statsByUnit[employee.unidad]) statsByUnit[employee.unidad] = 0;
                        statsByUnit[employee.unidad]++;

                        // Contar por tipo de documento
                        if (!statsByDocument[docName]) statsByDocument[docName] = 0;
                        statsByDocument[docName]++;
                    }
                });
            }
        });

        console.log("📊 Estadísticas generadas:", { statsByUnit, statsByDocument });

        res.json({ statsByUnit, statsByDocument });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
});
module.exports = router;
