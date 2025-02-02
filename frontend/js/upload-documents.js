// URL base del backend
const apiBaseUrl = 'http://localhost:3000';
const urlParams = new URLSearchParams(window.location.search); // Obtener los parámetros de la URL
const employeeId = urlParams.get('id'); // Extraer el valor del parámetro 'id'

console.log('ID del funcionario obtenido de la URL:', employeeId);

if (!employeeId) {
    alert('No se encontró el ID del funcionario. Regresando a la página anterior.');
    window.location.href = 'documents.html';
}

async function loadEmployeeData(employeeId) {
    const token = localStorage.getItem('authToken');
    console.log("Token obtenido:", token);
    console.log("ID enviado al backend:", employeeId);

    try {
        const response = await fetch(`${apiBaseUrl}/documents/${employeeId}`, {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
        });

        console.log('Estado de la respuesta:', response.status);

        const responseText = await response.text();
        console.log("Cuerpo de la respuesta:", responseText);

        if (!response.ok) {
            console.error("Error en la respuesta del backend:", responseText);
            throw new Error('Error al obtener los datos del funcionario');
        }

        const employee = JSON.parse(responseText);
        console.log('Datos del funcionario obtenidos del backend:', employee);

        // Verificar los elementos HTML
        console.log('Elemento CI:', document.getElementById('employeeCI'));
        console.log('Elemento Nombre:', document.getElementById('employeeName'));
        console.log('Elemento Apellido:', document.getElementById('employeeLastName'));
        console.log('Elemento Cargo:', document.getElementById('employeePosition'));

        // Asignar los datos
        document.getElementById('employeeCI').textContent = employee.funcionario?.ci || 'No disponible';
        document.getElementById('employeeName').textContent = employee.funcionario?.nombres || 'No disponible';
        document.getElementById('employeeLastName').textContent = employee.funcionario?.apellidos || 'No disponible';
        document.getElementById('employeePosition').textContent = employee.funcionario?.cargo || 'No disponible';

        console.log('Datos asignados al HTML correctamente.');
        // Renderizar la lista de documentos
        renderDocumentsList(employee.documents || {});
    } catch (error) {
        console.error('Error al cargar datos del funcionario:', error);
        alert('Hubo un problema al cargar los datos del funcionario. Regresando a la página anterior.');
        window.location.href = 'documents.html';
    }
}
console.log('Cargando datos del funcionario...');

function renderDocumentsList(documents) {
    const documentsList = document.getElementById('documentsList');
    documentsList.innerHTML = ''; // Limpiar lista de documentos previamente cargada

    const documentTypes = [
        "carnetIdentidad",
        "certificadoNacimiento",
        "certificadoMatrimonio",
        "libretaMilitar",
        "croquisDomicilio",
        "curriculum",
        "tituloProvisionNacional",
        "diplomaAcademico",
        "rejap",
        "cenvi",
        "declaracionNotaria",
        "certificadoMedico",
        "nit",
        "declaracionBienesYRentas",
        "contrato"
    ];

    documentTypes.forEach((docType) => {
        // Obtener el estado del documento desde los datos proporcionados
        let documentStatus = documents[docType]?.status || "No Presentado";
        let documentDate = documents[docType]?.dueDate || "";

        // Si el estado es "Presento", mostrar "Subir" en el desplegable
        if (documentStatus === "Presento") {
            documentStatus = "Subir";
        }

        const documentRow = document.createElement('div');
        documentRow.classList.add('document-row', 'flex-row'); // Clase para estilos con flexbox

        const label = document.createElement('label');
        label.textContent = `${formatDocumentName(docType)}:`;
        label.classList.add('document-label'); // Clase opcional para el diseño

        const select = document.createElement('select');
        select.name = docType;
        select.dataset.docKey = docType;

        const options = ["No Corresponde", "No Presento", "Subir", "Pendiente"];
        options.forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;

            // Seleccionar el estado correcto
            if (documentStatus === option) {
                optionElement.selected = true; // Marcar como seleccionado
            }

            select.appendChild(optionElement);
        });

        // Crear el campo de fecha para "Pendiente"
        const dateInput = document.createElement('input');
        dateInput.type = "date";
        dateInput.name = `${docType}-date`;
        dateInput.style.display = (documentStatus === "Pendiente") ? "block" : "none";
        dateInput.value = documentDate ? new Date(documentDate).toISOString().split('T')[0] : ""; // Formatear fecha

        // Manejar cambios en el select para mostrar la fecha solo si es "Pendiente"
        select.addEventListener('change', (event) => {
            const selectedOption = event.target.value;

            if (selectedOption === "Pendiente") {
                dateInput.style.display = "block";
            } else {
                dateInput.style.display = "none";
                dateInput.value = ""; // Resetear fecha si no es "Pendiente"
            }
        });
        const extraInput = document.createElement('input');
        extraInput.style.display = "none";
        extraInput.type = "file";
        extraInput.name = `${docType}-file`;

        // Mostrar el campo de archivo si el estado es "Subir"
        if (documentStatus === "Subir") {
            extraInput.style.display = "block";
        }
        // Mostrar un enlace si ya hay un archivo subido
        if (documents[docType]?.filePath) {
            const fileLink = document.createElement('a');
            fileLink.href = documents[docType].filePath;
            fileLink.textContent = 'Ver documento subido';
            fileLink.target = '_blank';
            documentRow.appendChild(fileLink);
        }

        // Manejar cambios en el desplegable
        select.addEventListener('change', (event) => {
            const selectedOption = event.target.value;
            if (selectedOption === "Subir") {
                extraInput.style.display = "block";
            } else {
                extraInput.style.display = "none";
            }
        });

        documentRow.appendChild(label);
        documentRow.appendChild(select);
        documentRow.appendChild(dateInput);
        documentRow.appendChild(extraInput);
        documentsList.appendChild(documentRow);
    });
}
// Función para formatear nombres de documentos (opcional)
function formatDocumentName(docType) {
    return docType
        .replace(/([A-Z])/g, ' $1') // Agregar espacio antes de mayúsculas
        .replace(/^./, (str) => str.toUpperCase()); // Capitalizar la primera letra
}

document.getElementById('saveChangesButton').addEventListener('click', async (event) => {
    event.preventDefault(); // Evita que el formulario se envíe automáticamente

    const token = localStorage.getItem('authToken');
    const updatedDocuments = {};
    const formData = new FormData();

    // Iterar sobre cada documento
    document.querySelectorAll('.document-row').forEach((row) => {
        const documentType = row.querySelector('select').dataset.docKey; // Obtenemos el tipo de documento
        const status = row.querySelector('select').value; // Estado seleccionado
        const fileInput = row.querySelector(`input[name="${documentType}-file"]`);
        const file = fileInput?.files[0];
        const isFileUploaded = row.querySelector('a'); // Enlace del documento subido

        // Obtener la fecha si el estado es "Pendiente"
        const dueDateInput = row.querySelector(`input[name="${documentType}-date"]`);
        const dueDate = (status === "Pendiente" && dueDateInput?.value) ? new Date(dueDateInput.value).toISOString() : null;
        console.log(`📌 Tipo: ${documentType}, Estado: ${status}, Fecha capturada correctamente: ${dueDate}`);

        // Si el estado es "Subir" y no hay un archivo ya subido
        if (status === "Subir" && !file && !isFileUploaded) {
            alert(`Debes seleccionar un archivo para el documento: ${documentType}`);
            throw new Error(`Archivo requerido para el documento: ${documentType}`);
        }

        // Si el estado es "Subir" y hay un archivo nuevo, añádelo
        if (status === "Subir" && file) {
            formData.append('files', file);
            const documentTypes = [];
            const filesMap = [];
            documentTypes.push(documentType); // Añadir tipo de documento
            document.querySelectorAll('.document-row').forEach((row) => {
                const select = row.querySelector('select');
                const documentType = select.dataset.docKey?.trim(); // Asegúrate de limpiar espacios
                const status = select.value;
            
                if (status === "Subir") {
                    const fileInput = row.querySelector(`input[name="${documentType}-file"]`);
                    if (fileInput && fileInput.files.length > 0) {
                        documentTypes.push(documentType); // Añade el tipo de documento
                        filesMap.push({ documentType, file: fileInput.files[0] }); // Mapea el archivo con el tipo de documento
                    }
                }
            });
            
            // Añadir archivos y documentTypes al FormData
            filesMap.forEach(({ documentType, file }) => {
                formData.append('files', file); // Asocia el archivo al FormData
            });
            formData.append('documentTypes', JSON.stringify(documentTypes));
        }

        // Agregar el estado a `updatedDocuments` si no es "Subir"
        if (status !== "Subir") {
            updatedDocuments[documentType] = { status };
            
            // Si el estado es "Pendiente", guardar la fecha de vencimiento
            if (status === "Pendiente") {
                updatedDocuments[documentType].dueDate = dueDate ? dueDate : null; 
            }
        }
    });
    console.log("📤 Datos enviados al backend:", updatedDocuments); // 🟢 Verifica si dueDate está aquí

    try {
        // Enviar los estados de documentos que no son "Subir"
        if (Object.keys(updatedDocuments).length > 0) {
            const response = await fetch(`${apiBaseUrl}/documents/${employeeId}/documents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedDocuments),
            });

            if (!response.ok) {
                throw new Error('Error al guardar los estados de los documentos.');
            }
        }

        // Enviar archivos si hay nuevos para subir
        if (formData.has('files')) {
            const response = await fetch(`${apiBaseUrl}/documents/${employeeId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Error al subir documentos.');
            }
        }

        alert('Los cambios se han guardado exitosamente.');
        window.location.href = 'documents.html'; // Redirigir a la tabla principal
    } catch (error) {
        console.error('Error al guardar los documentos:', error);
        alert('Hubo un problema al guardar los documentos.');
    }
});

// Subir documento para un funcionario
async function uploadDocument(employeeId, documentType, file) {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
        const response = await fetch(`${apiBaseUrl}/documents/${employeeId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Error al subir el documento');
        }

        alert('Documento subido exitosamente');
    } catch (error) {
        console.error('Error al subir documento:', error);
        alert('Hubo un problema al subir el documento.');
    }
}

loadEmployeeData(employeeId);
