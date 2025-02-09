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
                <td>${row.fechaLimite}</td> <!-- Mostrar fecha límite -->
                <td class="${statusClass}">${row.estado}</td>
            `;
            tbody.appendChild(tr);
        });
        loadStatistics();

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
// Función para cargar las estadísticas y generar gráficos
async function loadStatistics() {
    try {
        const response = await fetch(`${apiBaseUrl}/reports/statistics`);
        if (!response.ok) {
            throw new Error('Error al obtener estadísticas');
        }

        const data = await response.json();
        console.log("📊 Datos para gráficos:", data);

        if (Object.keys(data.statsByUnit).length === 0 && Object.keys(data.statsByDocument).length === 0) {
            console.warn("⚠ No hay suficientes datos para generar gráficos.");
            return;
        }

        const chartByUnitCanvas = document.getElementById('chartByUnit');
        const chartByDocumentCanvas = document.getElementById('chartByDocument');

        if (!chartByUnitCanvas || !chartByDocumentCanvas) {
            console.error("❌ No se encontraron los elementos canvas para los gráficos.");
            return;
        }

        if (window.chartByUnit instanceof Chart) {
            window.chartByUnit.destroy();
        }
        if (window.chartByDocument instanceof Chart) {
            window.chartByDocument.destroy();
        }

        // **Gráfico de barras mejorado con valores sobre las barras**
        const ctx1 = chartByUnitCanvas.getContext('2d');
        window.chartByUnit = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: Object.keys(data.statsByUnit),
                datasets: [{
                    label: 'Documentos Faltantes por Unidad',
                    data: Object.values(data.statsByUnit),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { display: true, text: 'Documentos Faltantes por Unidad' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return ` ${context.raw} documentos`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // **Gráfico de pastel con porcentajes**
        const totalDocs = Object.values(data.statsByDocument).reduce((a, b) => a + b, 0);
        const ctx2 = chartByDocumentCanvas.getContext('2d');
        window.chartByDocument = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data.statsByDocument),
                datasets: [{
                    label: 'Documentos Faltantes por Tipo',
                    data: Object.values(data.statsByDocument),
                    backgroundColor: [
                        '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0',
                        '#9966ff', '#ff9f40', '#ff6384', '#c9cbcf'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: 'Distribución de Documentos Faltantes' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let percentage = ((context.raw / totalDocs) * 100).toFixed(2);
                                return ` ${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
    }
}
function updateSummary(stats) {
    // Total de documentos faltantes
    const totalMissing = Object.values(stats.statsByDocument).reduce((a, b) => a + b, 0);
    document.getElementById("totalDocuments").querySelector("span").textContent = totalMissing;

    // Unidad con más documentos faltantes
    const mostPendingUnit = Object.keys(stats.statsByUnit).reduce((a, b) => 
        stats.statsByUnit[a] > stats.statsByUnit[b] ? a : b, "---"
    );
    document.getElementById("mostPendingUnit").querySelector("span").textContent = mostPendingUnit;

    // Documento más faltante
    const mostPendingDoc = Object.keys(stats.statsByDocument).reduce((a, b) => 
        stats.statsByDocument[a] > stats.statsByDocument[b] ? a : b, "---"
    );
    document.getElementById("mostPendingDocument").querySelector("span").textContent = mostPendingDoc;
}
// Cargar las unidades y documentos al iniciar la página
loadUnits();
loadDocuments();