// URL base del backend
const apiBaseUrl = 'http://localhost:3000';

// Función para cargar los funcionarios
// Función para cargar los funcionarios
async function loadEmployees() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('No estás autenticado. Por favor, inicia sesión.');
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/employees`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Error al cargar funcionarios');
        }

        const employees = await response.json();
        const tbody = document.getElementById('employeesTable').querySelector('tbody');
        tbody.innerHTML = ''; // Limpiar la tabla

        employees.forEach((employee) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.ci}</td>
                <td>${employee.nombres}</td>
                <td>${employee.apellidos}</td>
                <td>${employee.cargo}</td>
                <td>${employee.unidad}</td>
                <td>
                    <button class="edit-employee-button" data-id="${employee._id}">Editar</button>
                    <button class="delete-employee-button" data-id="${employee._id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Asignar eventos a los botones
        document.querySelectorAll('.edit-employee-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const employeeId = e.target.dataset.id;
                openEmployeeModal(employeeId);
            });
        });

        document.querySelectorAll('.delete-employee-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const employeeId = e.target.dataset.id;
                deleteEmployee(employeeId);
            });
        });
    } catch (error) {
        console.error('Error al cargar funcionarios:', error);
    }
}


// Función para abrir el modal
async function openEmployeeModal(employeeId = null) {
    const modal = document.getElementById('employeeModal');
    const modalTitle = document.getElementById('employeeModalTitle');
    const ciField = document.getElementById('ci');
    const nombresField = document.getElementById('nombres');
    const apellidosField = document.getElementById('apellidos');
    const cargoField = document.getElementById('cargo');
    const unidadField = document.getElementById('unidad');
    const fechaInicioField = document.getElementById('fechaInicioContrato');
    const fechaFinField = document.getElementById('fechaFinContrato');

    console.log('ID enviado al backend para editar funcionario:', employeeId);

    // Mostrar modal
    modal.classList.add('show');

    if (employeeId) {
        // Editar Funcionario
        modalTitle.textContent = 'Editar Funcionario';

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${apiBaseUrl}/employees/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('No se pudieron obtener los datos del funcionario');
            }

            const employee = await response.json();

            // Validar que los elementos existen antes de asignar valores
            if (ciField) ciField.value = employee.ci || '';
            if (nombresField) nombresField.value = employee.nombres || '';
            if (apellidosField) apellidosField.value = employee.apellidos || '';
            if (cargoField) cargoField.value = employee.cargo || '';
            if (unidadField) unidadField.value = employee.unidad || '';
            if (fechaInicioField) fechaInicioField.value = employee.fechaInicioContrato?.split('T')[0] || '';
            if (fechaFinField) fechaFinField.value = employee.fechaFinContrato?.split('T')[0] || '';
             // Asignar evento de envío al formulario
            const employeeForm = document.getElementById('employeeForm');
            employeeForm.onsubmit = (e) => {
                e.preventDefault();
                updateEmployee(employeeId);
            };

        } catch (error) {
            console.error('Error al cargar funcionario:', error);
            alert('Hubo un problema al cargar los datos del funcionario.');
            modal.classList.remove('show');
        }
    }
}


// Función para cerrar el modal
document.getElementById('closeEmployeeModal').addEventListener('click', () => {
    const modal = document.getElementById('employeeModal');
    modal.classList.remove('show');
});

// Función para crear un funcionario
async function createEmployee() {
    // Verificar que los elementos existen antes de obtener su valor
    const ciField = document.getElementById('ci');
    const nombresField = document.getElementById('nombres');
    const apellidosField = document.getElementById('apellidos');
    const cargoField = document.getElementById('cargo');
    const unidadField = document.getElementById('unidad');
    const fechaInicioField = document.getElementById('fechaInicioContrato');
    const fechaFinField = document.getElementById('fechaFinContrato');

    // Asegurar que ningún campo sea nulo
    if (!ciField || !nombresField || !apellidosField || !cargoField || !unidadField || !fechaInicioField || !fechaFinField) {
        console.error('Uno o más campos no existen en el DOM.');
        alert('Error interno: No se encontraron campos del formulario.');
        return;
    }

    // Asignar valores
    const ci = ciField.value.trim();
    const nombres = nombresField.value.trim();
    const apellidos = apellidosField.value.trim();
    const cargo = cargoField.value.trim();
    const unidad = unidadField.value.trim();
    const fechaInicioContrato = fechaInicioField.value;
    const fechaFinContrato = fechaFinField.value;

    // Validar que los campos requeridos no estén vacíos
    if (!ci || !nombres || !apellidos || !cargo || !unidad || !fechaInicioContrato) {
        alert('Todos los campos son obligatorios.');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiBaseUrl}/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                ci,
                nombres,
                apellidos,
                cargo,
                unidad,
                fechaInicioContrato,
                fechaFinContrato,
            }),
        });

        if (!response.ok) {
            throw new Error('Error al crear el funcionario');
        }

        alert('Funcionario creado exitosamente');
        document.getElementById('employeeModal').classList.remove('show'); // Cerrar el modal
        loadEmployees(); // Recargar la tabla de funcionarios
    } catch (error) {
        console.error('Error al crear funcionario:', error);
    }
}


document.getElementById('addEmployeeButton').addEventListener('click', () => {
    const modal = document.getElementById('employeeModal');
    const modalTitle = document.getElementById('employeeModalTitle');
    const employeeForm = document.getElementById('employeeForm');

    // Limpiar campos del formulario
    document.getElementById('ci').value = '';
    document.getElementById('nombres').value = '';
    document.getElementById('apellidos').value = '';
    document.getElementById('cargo').value = '';
    document.getElementById('unidad').value = '';
    document.getElementById('fechaInicioContrato').value = '';
    document.getElementById('fechaFinContrato').value = '';

    // Cambiar el título del modal
    modalTitle.textContent = 'Agregar Funcionario';

    // Asignar función de creación al evento submit del formulario
    employeeForm.onsubmit = (e) => {
        e.preventDefault();
        console.log('Formulario enviado. Verificando campos...');
        createEmployee(); // Llamar a la función para crear un funcionario
    };

    // Mostrar el modal
    modal.classList.add('show');
});



// Función para actualizar un funcionario
async function updateEmployee(employeeId) {
    const ci = document.getElementById('ci').value;
    const nombres = document.getElementById('nombres').value;
    const apellidos = document.getElementById('apellidos').value;
    const cargo = document.getElementById('cargo').value;
    const unidad = document.getElementById('unidad').value;
    const fechaInicioContrato = document.getElementById('fechaInicioContrato').value;
    const fechaFinContrato = document.getElementById('fechaFinContrato').value;

    console.log('Datos enviados al backend para actualizar:', {
        ci, nombres, apellidos, cargo, unidad, fechaInicioContrato, fechaFinContrato
    });

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiBaseUrl}/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                ci,
                nombres,
                apellidos,
                cargo,
                unidad,
                fechaInicioContrato,
                fechaFinContrato,
            }),
        });

        console.log('Respuesta del backend al actualizar funcionario:', response);

        if (!response.ok) {
            throw new Error('Error al actualizar el funcionario');
        }

        alert('Funcionario actualizado exitosamente');
        document.getElementById('employeeModal').classList.remove('show'); // Cerrar modal
        loadEmployees(); // Recargar la tabla de funcionarios
    } catch (error) {
        console.error('Error al actualizar funcionario:', error);
        alert('Hubo un problema al intentar actualizar el funcionario.');
    }
}


// Función para eliminar un funcionario
async function deleteEmployee(employeeId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este funcionario?')) return;

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiBaseUrl}/employees/${employeeId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el funcionario');
        }

        alert('Funcionario eliminado exitosamente');
        loadEmployees();
    } catch (error) {
        console.error('Error al eliminar funcionario:', error);
    }
}

// Cargar funcionarios al inicio
loadEmployees();
