// URL base del backend
const apiBaseUrl = 'http://localhost:3000';

// Función para cargar notificaciones de documentos pendientes
async function loadNotifications() {
    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`${apiBaseUrl}/documents/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Error al obtener notificaciones');
        }

        const notifications = await response.json();
        console.log('📥 Notificaciones obtenidas:', notifications);

        // Referencia a la tabla
        const tbody = document.getElementById('notificationsTable').querySelector('tbody');
        tbody.innerHTML = ''; // Limpiar la tabla antes de llenarla

        notifications.forEach(notification => {
            const row = document.createElement('tr');

            // Calcular los días restantes
            const today = new Date();
            const dueDate = new Date(notification.fechaLimite);
            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            // Determinar el estado
            let statusText = "Pendiente";
            let statusClass = "pending";
            if (daysLeft <= 3 && daysLeft > 0) {
                statusText = "Urgente";
                statusClass = "urgent";
            } else if (daysLeft <= 0) {
                statusText = "Vencido";
                statusClass = "expired";
            }

            row.innerHTML = `
                <td>${notification.funcionario.nombres} ${notification.funcionario.apellidos}</td>
                <td>${notification.documento}</td>
                <td>${dueDate.toLocaleDateString()}</td>
                <td>${daysLeft} días</td>
                <td class="${statusClass}">${statusText}</td>
                <td>
                    <button class="notify-button" data-id="${notification.funcionario.ci}" data-doc="${notification.documento}">🔔 Notificar</button>
                    <button class="call-button" data-id="${notification.funcionario.ci}" data-doc="${notification.documento}">📞 Llamar</button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Agregar eventos a los botones de acción
        document.querySelectorAll('.notify-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const funcionarioCI = e.target.dataset.id;
                const documento = e.target.dataset.doc;
                notifyUser(funcionarioCI, documento);
            });
        });

        document.querySelectorAll('.call-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const funcionarioCI = e.target.dataset.id;
                const documento = e.target.dataset.doc;
                registerCall(funcionarioCI, documento);
            });
        });

    } catch (error) {
        console.error('❌ Error al cargar notificaciones:', error);
    }
}

// Función para notificar al usuario (ejemplo de WhatsApp)
function notifyUser(funcionarioCI, documento) {
    alert(`📩 Se enviará un recordatorio sobre el documento: ${documento} para el funcionario con CI: ${funcionarioCI}`);
}

// Función para registrar una llamada
function registerCall(funcionarioCI, documento) {
    alert(`📞 Se registrará una llamada sobre el documento: ${documento} para el funcionario con CI: ${funcionarioCI}`);
}

// Cargar notificaciones al cargar la página
loadNotifications();
