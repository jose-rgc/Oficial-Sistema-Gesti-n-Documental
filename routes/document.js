const express = require('express');
const Employee = require('../models/Employee');
const authenticateToken = require('../middleware/authenticateToken');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configuración de multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('application/')) {
            return cb(new Error('Tipo de archivo no permitido'), false);
        }
        cb(null, true);
    }
});

// Ruta para obtener notificaciones de documentos pendientes y no presentados
// Ruta para obtener notificaciones de documentos pendientes y no presentados
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const employees = await Employee.find();
        const notifications = [];

        employees.forEach((employee) => {
            employee.documents.forEach((document, documentType) => {
                // Incluir tanto documentos "Pendiente" como "No Presentado"
                if (document.status === "Pendiente" || document.status === "No Presentado") {
                    const now = new Date();
                    let dueDate = document.dueDate ? new Date(document.dueDate) : null;

                    // Si el documento es "No Presentado", no tiene fecha definida
                    const daysLeft = dueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;

                    // Determinar prioridad y estado final
                    let prioridad = "Baja";
                    let estadoFinal = document.status;
                    let fechaLimiteTexto = dueDate ? dueDate.toISOString().split('T')[0] : ""; // Fecha en formato YYYY-MM-DD

                    if (document.status === "No Presentado") {
                        prioridad = "Urgente"; // Siempre urgente si nunca presentó el documento
                        estadoFinal = "No Presentó";
                        fechaLimiteTexto = ""; // Sin fecha límite
                    } else if (daysLeft !== null) {
                        if (daysLeft <= 3 && daysLeft > 0) {
                            prioridad = "Alta";
                        } else if (daysLeft <= 0) {
                            prioridad = "Vencido";
                            estadoFinal = "Vencido";
                        }
                    }

                    notifications.push({
                        funcionario: {
                            ci: employee.ci,
                            nombres: employee.nombres,
                            apellidos: employee.apellidos
                        },
                        documento: documentType,
                        estado: estadoFinal,
                        fechaLimite: fechaLimiteTexto, // Vacío si es "No Presentó"
                        diasRestantes: daysLeft !== null ? daysLeft : "", // Vacío si no aplica
                        prioridad: prioridad
                    });
                }
            });
        });

        console.log("📢 Notificaciones enviadas:", JSON.stringify(notifications, null, 2)); // Verificar en el backend
        res.json(notifications);
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ message: 'Error al obtener notificaciones' });
    }
});


// Ruta para obtener documentos de un funcionario
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const employee = await Employee.findById(id);
        if (!employee) return res.status(404).json({ message: 'Funcionario no encontrado' });

        const documents = {};
        employee.documents.forEach((value, key) => {
            documents[key] = value;
        });

        res.json({
            documents: documents,
            funcionario: {
                ci: employee.ci,
                nombres: employee.nombres,
                apellidos: employee.apellidos,
                cargo: employee.cargo,
                unidad: employee.unidad,
            },
        });
    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({ message: 'Error al obtener documentos' });
    }
});

// Subir documento para un funcionario
router.post('/:id', authenticateToken, upload.array('files', 20), async (req, res) => {
    const { id } = req.params;

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No se subieron archivos' });
        }

        const employee = await Employee.findById(id);
        if (!employee) return res.status(404).json({ message: 'Funcionario no encontrado' });
        
        console.log('Document Types recibidos en el backend (raw):', req.body.documentTypes);
        let documentTypes = [];
        if (req.body.documentTypes) {
            try {
                // Asegúrate de que req.body.documentTypes no sea un array de cadenas JSON
                if (Array.isArray(req.body.documentTypes)) {
                    documentTypes = req.body.documentTypes.flatMap((dt) => JSON.parse(dt)); // Parsear cada entrada si es necesario
                } else {
                    documentTypes = JSON.parse(req.body.documentTypes); // Parsear como un único JSON
                }
                if (!Array.isArray(documentTypes)) {
                    throw new Error('documentTypes no es un array válido');
                }
            } catch (error) {
                console.error('Error al parsear documentTypes:', error);
                return res.status(400).json({ message: 'El formato de documentTypes no es válido' });
            }
        }
        console.log('Document Types procesados en el backend:', documentTypes);

        if (req.files.length !== documentTypes.length) {
            return res.status(400).json({
                message: "La cantidad de archivos no coincide con los tipos de documento enviados.",
            });
        }
        
        req.files.forEach((file, index) => {
            const documentType = documentTypes[index]?.trim();
            if (!documentType) {
                throw new Error(`No se encontró un tipo de documento para el archivo ${file.originalname}`);
            }
        
            const existingDocument = employee.documents.get(documentType);
        
            if (existingDocument) {
                existingDocument.status = "Presento";
                existingDocument.filePath = file.path;
            } else {
                employee.documents.set(documentType, {
                    status: "Presento",
                    filePath: file.path,
                });
            }
        });

        await employee.save();
        res.json({ message: 'Documentos subidos exitosamente', documents: employee.documents });
    } catch (error) {
        console.error('Error al subir documentos:', error);
        res.status(500).json({ message: 'Error al subir documentos', error: error.message });
    }
});

// Actualizar estados de documentos
router.post('/:id/documents', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const updatedDocuments = req.body;
    console.log("📥 Datos recibidos en el backend:", JSON.stringify(updatedDocuments, null, 2));
    try {
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ message: 'Funcionario no encontrado' });
        }

        Object.keys(updatedDocuments).forEach((docKey) => {
            const documentData = updatedDocuments[docKey];
            console.log(`📥 Procesando en el backend -> Tipo: ${docKey}, Estado: ${documentData.status}, Fecha: ${documentData.dueDate}`);

            employee.documents.set(docKey, {
                status: documentData.status || "No Presentado",
                dueDate: documentData.dueDate ? new Date(documentData.dueDate) : null, // 💡 Forzar conversión a Date
                filePath: documentData.filePath || null,
            });
        });

        await employee.save();

        res.status(200).json({ message: 'Documentos actualizados correctamente', documents: employee.documents });
    } catch (error) {
        console.error('Error al actualizar documentos:', error);
        res.status(500).json({ message: 'Error al actualizar documentos' });
    }
});

module.exports = router;

