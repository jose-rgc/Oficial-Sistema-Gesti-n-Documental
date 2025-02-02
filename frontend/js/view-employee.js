// URL base del backend
const apiBaseUrl = 'http://localhost:3000';

// Obtener el ID del funcionario desde la URL
const urlParams = new URLSearchParams(window.location.search);
const employeeId = urlParams.get('id');

console.log('ID del funcionario obtenido:', employeeId);

// Verificar si el ID es válido
if (!employeeId) {
    alert('No se encontró el ID del funcionario. Regresando a la página anterior.');
    window.location.href = 'documents.html';
}

// Función para cargar los datos del funcionario
async function loadEmployeeDetails() {
    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`${apiBaseUrl}/employees/${employeeId}`, {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
            throw new Error('Error al obtener los datos del funcionario');
        }

        const employee = await response.json();
        console.log('Datos obtenidos del backend:', employee);

        // Asignar los datos a la tabla en el HTML
        document.getElementById('employeeCI').textContent = employee.ci || 'No disponible';
        document.getElementById('employeeName').textContent = employee.nombres || 'No disponible';
        document.getElementById('employeeLastName').textContent = employee.apellidos || 'No disponible';
        document.getElementById('employeePosition').textContent = employee.cargo || 'No disponible';
        document.getElementById('employeeUnit').textContent = employee.unidad || 'No disponible';
        document.getElementById('employeeStartDate').textContent = employee.fechaInicioContrato ? new Date(employee.fechaInicioContrato).toLocaleDateString() : 'No disponible';
        document.getElementById('employeeEndDate').textContent = employee.fechaFinContrato ? new Date(employee.fechaFinContrato).toLocaleDateString() : 'No disponible';

        // Llamar a la función para mostrar los documentos y sus estados
        renderDocumentsList(employee.documents || {});
        
    } catch (error) {
        console.error('Error al cargar los datos del funcionario:', error);
        alert('Hubo un problema al cargar los datos del funcionario.');
        window.location.href = 'documents.html';
    }
}
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait", // Vertical (normal)
        unit: "mm", // Unidades en milímetros
        format: "letter" // Tamaño carta (8.5 x 11 pulgadas)
    });

    // Márgenes y posición inicial
    const marginLeft = 15;
    let y = 20; // Posición inicial

    // Obtener datos del funcionario
    const employeeName = document.getElementById('employeeName').textContent;
    const employeeLastName = document.getElementById('employeeLastName').textContent;
    const employeeFullName = `${employeeName} ${employeeLastName}`; // Nombre completo
    const employeeCI = document.getElementById('employeeCI').textContent;
    const employeePosition = document.getElementById('employeePosition').textContent;
    const employeeStartDate = document.getElementById('employeeStartDate').textContent;
    const employeeEndDate = document.getElementById('employeeEndDate').textContent;

    // Obtener la fecha actual
    const today = new Date().toLocaleDateString();

    // Obtener documentos y sus estados
    const documentsTable = document.getElementById('documentsTable').querySelectorAll('tbody tr');
    let presentados = [];
    let pendientes = [];
    let noPresentados = [];
    let noCorresponde = [];

    documentsTable.forEach(row => {
        const docName = row.cells[0].textContent;
        const docStatus = row.cells[1].textContent;

        if (docStatus.includes("Presento")) {
            presentados.push(docName);
        } else if (docStatus.includes("Pendiente")) {
            const fechaLimite = docStatus.split(": ")[1] || "Sin fecha";
            pendientes.push(`${docName} - Fecha límite: ${fechaLimite}`);
        } else if (docStatus.includes("No Presentado")) {
            noPresentados.push(docName);
        } else if (docStatus.includes("No Corresponde")) {
            noCorresponde.push(docName);
        }
    });

    // Título principal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("DOCUMENTO DE COMPROMISO DE ENTREGA DE DOCUMENTOS", marginLeft, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`AUTORIDAD CONTRATANTE: Gobierno Autónomo Municipal de Potosí`, marginLeft, y);
    y += 6;
    doc.text(`LUGAR Y FECHA: ${today}`, marginLeft, y);
    
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL TRABAJADOR", marginLeft, y);
    
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre Completo: ${employeeFullName}`, marginLeft, y);
    y += 6;
    doc.text(`Cédula de Identidad: ${employeeCI}`, marginLeft, y);
    y += 6;
    doc.text(`Cargo: ${employeePosition}`, marginLeft, y);
    y += 6;
    doc.text(`Fecha de Inicio del Contrato: ${employeeStartDate}`, marginLeft, y);
    y += 6;
    doc.text(`Fecha Fin del Contrato: ${employeeEndDate}`, marginLeft, y);
    
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DE DOCUMENTOS", marginLeft, y);

    // Documentos Presentados
    y += 6;
    doc.text("Documentos Presentados:", marginLeft, y);
    doc.setFont("helvetica", "normal");
    presentados.forEach(docName => {
        y += 5;
        doc.text(`- ${docName}`, marginLeft + 5, y);
    });

    // Documentos Pendientes
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Documentos Pendientes:", marginLeft, y);
    doc.setFont("helvetica", "normal");
    pendientes.forEach(docName => {
        y += 5;
        doc.text(`- ${docName}`, marginLeft + 5, y);
    });

    // Documentos No Presentados
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Documentos No Presentados:", marginLeft, y);
    doc.setFont("helvetica", "normal");
    noPresentados.forEach(docName => {
        y += 5;
        doc.text(`- ${docName}`, marginLeft + 5, y);
    });

    // Documentos No Corresponden
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Documentos que No Corresponden:", marginLeft, y);
    doc.setFont("helvetica", "normal");
    noCorresponde.forEach(docName => {
        y += 5;
        doc.text(`- ${docName}`, marginLeft + 5, y);
    });

    // Declaración y Compromiso
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("DECLARACIÓN Y COMPROMISO", marginLeft, y);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Yo, ${employeeName}, con C.I. N° ${employeeCI}, declaro haber entregado`, marginLeft, y);
    y += 6;
    doc.text("los documentos mencionados en la sección de Documentos Presentados y me comprometo", marginLeft, y);
    y += 6;
    doc.text("a entregar los documentos pendientes antes de la fecha límite establecida.", marginLeft, y);
    y += 6;
    doc.text("En caso de no cumplir con la entrega en el tiempo acordado, entiendo que podrán aplicarse", marginLeft, y);
    y += 6;
    doc.text("medidas administrativas, que pueden incluir la suspensión o anulación del proceso de", marginLeft, y);
    y += 6;
    doc.text("contratación, según la normativa vigente.", marginLeft, y);

    // Firmas
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("FIRMAS", marginLeft, y);

    y += 10;
    doc.setFont("helvetica", "normal");
    doc.text("Firma del Trabajador: ________________________", marginLeft, y);
    y += 6;
    doc.text(`Nombre: ${employeeFullName}`, marginLeft, y);

    y += 10;
    doc.text("Firma del Responsable de Contrataciones: ________________________", marginLeft, y);
    y += 6;
    doc.text("Cargo: Encargado de Inducciones", marginLeft, y);

    // Guardar el PDF
    doc.save(`Compromiso_${employeeFullName}.pdf`);
}

// Asignar el evento al botón de generar reporte
document.getElementById("generateReportButton").addEventListener("click", () => {
    console.log("Botón Generar Reporte presionado"); // Mensaje en la consola para depuración
    generatePDF();
});

// Asignar el evento al botón de generar reporte
document.getElementById("generateReportButton").addEventListener("click", () => {
    console.log("Botón Generar Reporte presionado"); // Mensaje en la consola para depuración
    generatePDF();
});

function renderDocumentsList(documents) {
    const tableBody = document.getElementById('documentsTable').querySelector('tbody');
    tableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

    const documentNames = {
        carnetIdentidad: "Carnet de Identidad",
        certificadoNacimiento: "Certificado de Nacimiento",
        certificadoMatrimonio: "Certificado de Matrimonio",
        libretaMilitar: "Libreta Militar",
        croquisDomicilio: "Croquis de Domicilio",
        curriculum: "Currículum",
        tituloProvisionNacional: "Título Provisión Nacional",
        diplomaAcademico: "Diploma Académico",
        rejap: "Rejap",
        cenvi: "Cenvi",
        declaracionNotaria: "Declaración Notaria",
        certificadoMedico: "Certificado Médico",
        nit: "NIT",
        declaracionBienesYRentas: "Declaración de Bienes y Rentas",
        contrato: "Contrato"
    };

    Object.keys(documentNames).forEach((docKey) => {
        const row = document.createElement('tr');
        const documentData = documents[docKey] || {};
        const documentStatus = documentData.status || "No Presentado";
        const filePath = documentData.filePath || null;
        const dueDate = documentData.dueDate ? new Date(documentData.dueDate).toLocaleDateString() : null;

        let statusDisplay = documentStatus;
        let statusColor = "";

        if (documentStatus === "Presento" && filePath) {
            statusDisplay = `✅ <a href="${filePath}" target="_blank">Ver Documento</a>`;
            statusColor = "green";
        } else if (documentStatus === "Pendiente" && dueDate) {
            statusDisplay = `⚠️ Pendiente - Fecha Límite: ${dueDate}`;
            statusColor = "orange";
        } else if (documentStatus === "No Presentado") {
            statusDisplay = "❌ No Presentado";
            statusColor = "red";
        } else if (documentStatus === "No Corresponde") {
            statusDisplay = "⚪ No Corresponde";
            statusColor = "gray";
        }

        row.innerHTML = `
            <td>${documentNames[docKey]}</td>
            <td style="color: ${statusColor}; font-weight: bold;">${statusDisplay}</td>
        `;

        tableBody.appendChild(row);
    });
}


// Llamar a la función al cargar la página
loadEmployeeDetails();
