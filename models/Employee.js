const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    ci: { type: String, required: true, unique: true }, // Carnet de Identidad
    nombres: { type: String, required: true },
    apellidos: { type: String, required: true },
    cargo: { type: String, required: true },
    unidad: { type: String, required: true },
    fechaInicioContrato: { type: Date, required: true },
    fechaFinContrato: { type: Date, required: true },
    documents: {
        type: Map,
        of: new mongoose.Schema({
            status: { type: String, default: 'No Presentado' },
            dueDate: { type: Date, default: null },
            filePath: { type: String, default: null },
        }),
        default: {} // Inicializamos como un mapa vacío
    }
});

const Employee = mongoose.model('Employee', EmployeeSchema);
module.exports = Employee;

