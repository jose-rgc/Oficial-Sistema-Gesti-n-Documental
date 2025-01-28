const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Importar cors
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const employeeRoutes = require('./routes/employee');
const documentRoutes = require('./routes/document');
const authenticateToken = require('./middleware/authenticateToken');
const app = express();
const port = 3000;

app.use(cors()); // Activar CORS
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/employees', employeeRoutes);
app.use('/documents', documentRoutes);

mongoose.connect('mongodb://localhost:27017/document-management')
    .then(() => console.log('Conectado a MongoDB'))
    .catch((error) => console.error('Error al conectar a MongoDB', error));

app.listen(port, () => console.log(`Servidor escuchando en http://localhost:${port}`));
