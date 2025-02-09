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
    // Obtener rol del usuario autenticado
    const payload = JSON.parse(atob(token.split('.')[1])); 
    const userRole = payload.role;
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
                    <button class="edit-button" data-id="${employee._id}">Editar</button>
                    <button class="delete-button" data-id="${employee._id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Asignar eventos a los botones
        document.querySelectorAll('.edit-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const employeeId = e.target.dataset.id;
                if (userRole === 'user') {
                    alert('No tienes permiso para editar funcionarios.');
                    return;
                }
                openEmployeeModal(employeeId);
            });
        });

        document.querySelectorAll('.delete-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const employeeId = e.target.dataset.id;
                if (userRole === 'user') {
                    alert('No tienes permiso para eliminar funcionarios.');
                    return;
                }
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
        // ✅ Llamar a la función de validación antes de enviar los datos
        if (!validateEmployeeFields(ci, nombres, apellidos, cargo, unidad, fechaInicioContrato, fechaFinContrato)) {
            return; // 🚫 No se envían los datos si la validación falla
        }
            // 🚨 **Verificar si el CI ya existe**
            const ciExists = await checkIfCIExists(ci);
            if (ciExists) {
                alert('Error: Ya existe un funcionario con este CI.');
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
    const token = localStorage.getItem('authToken');
    const payload = JSON.parse(atob(token.split('.')[1])); 
    const userRole = payload.role;

    if (userRole === 'user') {
        alert('No tienes permiso para agregar funcionarios.');
        return;
    }

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

    modalTitle.textContent = 'Agregar Funcionario';

    employeeForm.onsubmit = (e) => {
        e.preventDefault();
        createEmployee();
    };

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
     // ✅ Llamar a la función de validación antes de enviar los datos
     if (!validateEmployeeFields(ci, nombres, apellidos, cargo, unidad, fechaInicioContrato, fechaFinContrato)) {
        return; // 🚫 No se envían los datos si la validación falla
    }
    // 🚨 **Verificar si el CI ya está en uso por otro funcionario**
    const ciExists = await checkIfCIExists(ci, employeeId);
    if (ciExists) {
        alert('Error: Ya existe otro funcionario con este CI.');
        return;
    }

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
// Función para filtrar empleados por nombre, apellido, cargo o unidad
function filterEmployees() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    
    const rows = document.querySelectorAll('#employeesTable tbody tr');

    rows.forEach(row => {
        const ci = row.cells[0].textContent.toLowerCase();
        const nombres = row.cells[1].textContent.toLowerCase();
        const apellidos = row.cells[2].textContent.toLowerCase();
        const cargo = row.cells[3].textContent.toLowerCase();
        const unidad = row.cells[4].textContent.toLowerCase();

        const matchesSearch = 
            ci.includes(searchText) ||
            nombres.includes(searchText) ||
            apellidos.includes(searchText) ||
            cargo.includes(searchText) ||
            unidad.includes(searchText);

        row.style.display = matchesSearch ? "" : "none";
    });
}

// Agregar evento a la barra de búsqueda
document.getElementById('searchInput').addEventListener('keyup', filterEmployees);
// ✅ Función para validar los datos del funcionario antes de enviarlo
function validateEmployeeFields(ci, nombres, apellidos, cargo, unidad, fechaInicioContrato, fechaFinContrato) {
    // ✅ Validación del CI (debe ser números con un posible sufijo alfanumérico)
    const ciRegex = /^[0-9]{5,10}(-[0-9A-Z]{1,3})?$/;
    if (!ciRegex.test(ci)) {
        alert('El CI debe tener entre 5 y 10 dígitos y puede incluir un sufijo opcional (Ejemplo: 8620805-1F).');
        return false;
    }

    // ✅ Validación de nombres y apellidos (solo letras y espacios, mínimo 3 caracteres)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]{3,50}$/;
    if (!nameRegex.test(nombres)) {
        alert('El campo "Nombres" solo puede contener letras y espacios (mínimo 3 caracteres).');
        return false;
    }
    if (!nameRegex.test(apellidos)) {
        alert('El campo "Apellidos" solo puede contener letras y espacios (mínimo 3 caracteres).');
        return false;
    }

    // ✅ Validación de cargo y unidad (solo letras, números y espacios, mínimo 3 caracteres)
    const textRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]{3,50}$/;
    if (!textRegex.test(cargo)) {
        alert('El campo "Cargo" solo puede contener letras, números y espacios (mínimo 3 caracteres).');
        return false;
    }
    if (!textRegex.test(unidad)) {
        alert('El campo "Unidad" solo puede contener letras, números y espacios (mínimo 3 caracteres).');
        return false;
    }

    // ✅ Validación de fechas (fecha de inicio debe ser menor o igual a fecha de fin)
    if (fechaInicioContrato && fechaFinContrato && fechaInicioContrato > fechaFinContrato) {
        alert('La fecha de inicio no puede ser mayor que la fecha de fin del contrato.');
        return false;
    }

    return true; // ✅ Todo correcto
}
async function checkIfCIExists(ci, employeeId = null) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiBaseUrl}/employees?ci=${ci}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Error al verificar el CI');
        }

        const employees = await response.json();

        // Si encuentra un empleado con el mismo CI y no es el mismo usuario que está editando, retorna true (existe)
        return employees.some(emp => emp.ci === ci && emp._id !== employeeId);
    } catch (error) {
        console.error('Error al verificar CI:', error);
        return false; // Por defecto, evitar bloqueos si hay un error
    }
}
// Cargar funcionarios al inicio
loadEmployees();
