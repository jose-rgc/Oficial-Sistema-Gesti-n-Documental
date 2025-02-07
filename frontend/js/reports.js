const apiBaseUrl = 'http://localhost:3000';
// Función para cargar las unidades disponibles
async function loadUnits() {
    const token = localStorage.getItem('authToken');

    if (!token) {
        console.error('❌ No hay token de autenticación. Redirigiendo al inicio de sesión.');
        window.location.href = "index.html"; 
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/employees/units`, {
            headers: {
                'Authorization': `Bearer ${token}`,  
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener unidades: ${response.statusText}`);
        }

        const units = await response.json();
        console.log('📥 Unidades obtenidas:', units);

        // Llenar el select con las unidades obtenidas
        const selectUnidad = document.getElementById('unidad');
        selectUnidad.innerHTML = '<option value="">-- Todas las Unidades --</option>';
        units.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            selectUnidad.appendChild(option);
        });

    } catch (error) {
        console.error('❌ Error al obtener unidades:', error);
    }
}

// Función para cargar los tipos de documentos disponibles
async function loadDocuments() {
    const documentosDisponibles = [
        "carnetIdentidad", "cenvi", "certificadoMatrimonio", "certificadoMedico",
        "certificadoNacimiento", "contrato", "croquisDomicilio", "curriculum",
        "declaracionBienesYRentas", "declaracionNotaria", "diplomaAcademico",
        "libretaMilitar", "nit", "rejap", "tituloProvisionNacional"
    ];

    const selectDocumento = document.getElementById('documento');
    selectDocumento.innerHTML = '<option value="">-- Todos los Documentos --</option>';
    documentosDisponibles.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc;
        option.textContent = doc;
        selectDocumento.appendChild(option);
    });
}

// Función para generar el reporte según la unidad seleccionada y el documento
async function generateReport() {
    const unidadSeleccionada = document.getElementById('unidad').value;
    const documentoSeleccionado = document.getElementById('documento').value;

    try {
        const url = new URL(`${apiBaseUrl}/reports/documents`);
        if (unidadSeleccionada) url.searchParams.append("unidad", unidadSeleccionada);
        if (documentoSeleccionado) url.searchParams.append("documento", documentoSeleccionado);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al obtener el reporte');
        }

        const reportData = await response.json();
        console.log('📌 Datos del Reporte:', reportData);

        const tbody = document.getElementById('reportTable').querySelector('tbody');
        tbody.innerHTML = ''; 

        if (reportData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No hay datos disponibles</td></tr>';
            return;
        }

        reportData.forEach(row => {
            let statusClass = row.estado === 'Pendiente' ? 'pending' : 'urgent';
            if (row.estado === 'No Presentado') statusClass = 'expired';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.funcionario.nombres} ${row.funcionario.apellidos}</td>
                <td>${row.funcionario.unidad}</td>
                <td>${row.documento}</td>
                <td class="${statusClass}">${row.estado}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('❌ Error al obtener el reporte:', error);
    }
}

// Función para exportar el reporte a PDF
function exportToPDF() {
    const table = document.getElementById('reportTable');

    if (!table) {
        alert("No hay datos para exportar.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Reporte de Documentos Incompletos", 14, 10);

    // Convertir la tabla en un formato imprimible
    doc.autoTable({ html: '#reportTable' });

    // Guardar el PDF
    doc.save('Reporte_Documentos_Incompletos.pdf');
}
// Cargar las unidades y documentos al iniciar la página
loadUnits();
loadDocuments();