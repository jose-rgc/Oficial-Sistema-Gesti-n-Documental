// URL base del backend
const apiBaseUrl = 'http://localhost:3000';

// Función para cargar funcionarios en la gestión de documentos
async function loadEmployeesForDocuments() {
    const token = localStorage.getItem('authToken');
        // Decodificar el token para obtener el rol del usuario
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role; // Obtiene el rol del usuario
    try {
        const response = await fetch(`${apiBaseUrl}/employees`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Error al cargar funcionarios');
        }

        const employees = await response.json();
        const tbody = document.getElementById('documentsTable').querySelector('tbody');
        tbody.innerHTML = ''; // Limpiar la tabla

        employees.forEach((employee) => {
            const documents = employee.documents || {}; // Asegúrate de que 'documents' sea un objeto
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.ci || ''}</td>
                <td>${employee.nombres || ''}</td>
                <td>${employee.apellidos || ''}</td>
                <td>${documents.carnetIdentidad || 'No Presentado'}</td>
                <td>${documents.certificadoNacimiento || 'No Presentado'}</td>
                <td>${documents.certificadoMatrimonio || 'No Presentado'}</td>
                <td>${documents.libretaMilitar || 'No Presentado'}</td>
                <td>${documents.croquisDomicilio || 'No Presentado'}</td>
                <td>${documents.curriculum || 'No Presentado'}</td>
                <td>${documents.tituloProvisionNacional || 'No Presentado'}</td>
                <td>${documents.diplomaAcademico || 'No Presentado'}</td>
                <td>${documents.rejap || 'No Presentado'}</td>
                <td>${documents.cenvi || 'No Presentado'}</td>
                <td>${documents.declaracionNotaria || 'No Presentado'}</td>
                <td>${documents.certificadoMedico || 'No Presentado'}</td>
                <td>${documents.nit || 'No Presentado'}</td>
                <td>${documents.declaracionBienesYRentas || 'No Presentado'}</td>
                <td>${documents.contrato || 'No Presentado'}</td>
                <td>
                    <button class="view-documents-button" data-id="${employee._id}">Ver</button>
                    <button class="upload-documents-button" data-id="${employee._id}">Subir Documentos</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar funcionarios:', error);
    }
    document.querySelectorAll('.upload-documents-button').forEach((button) => {
        button.addEventListener('click', (e) => {
            const employeeId = e.target.dataset.id;

                // Si el usuario es Admin, mostrar mensaje de error en lugar de redirigir
                if (userRole === 'admin') {
                    alert('No tienes permiso para subir documentos.');
                } else {
                    window.location.href = `upload-documents.html?id=${employeeId}`;
                }
        });
    });
    document.querySelectorAll('.view-documents-button').forEach((button) => {
        button.addEventListener('click', (e) => {
            const employeeId = e.target.dataset.id;
            console.log('ID enviado a view-employee:', employeeId);
            window.location.href = `view-employee.html?id=${employeeId}`; // Redirige a la nueva página
        });
    });
       
}
// Función para filtrar la tabla en tiempo real
function filterTable() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let table = document.getElementById("documentsTable");
    let rows = table.getElementsByTagName("tr");

    for (let i = 1; i < rows.length; i++) {
        let cells = rows[i].getElementsByTagName("td");
        let found = false;

        for (let j = 0; j < cells.length - 1; j++) { // Excluir columna de acciones
            if (cells[j].innerText.toLowerCase().includes(input)) {
                found = true;
                break;
            }
        }

        rows[i].style.display = found ? "" : "none";
    }
}
// Llamar a la función al cargar la página
loadEmployeesForDocuments();

