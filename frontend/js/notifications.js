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

        let notifications = await response.json();
        console.log('📥 Notificaciones obtenidas:', notifications);

        // Ordenar por prioridad (Vencidos -> Urgentes -> Pendientes)
        notifications.sort((a, b) => {
            const dateA = new Date(a.fechaLimite);
            const dateB = new Date(b.fechaLimite);
            return dateA - dateB;
        });

        const tbody = document.getElementById('notificationsTable').querySelector('tbody');
        tbody.innerHTML = '';

        notifications.forEach(notification => {
            const row = document.createElement('tr');

            const today = new Date();
            const dueDate = new Date(notification.fechaLimite);
            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

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
                    <button class="notify-button">🔔 Notificar</button>
                    <button class="call-button">📞 Llamar</button>
                </td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('❌ Error al cargar notificaciones:', error);
    }
}
function filterTable() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const statusValue = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#notificationsTable tbody tr');

    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const document = row.cells[1].textContent.toLowerCase();
        const status = row.cells[4].classList.contains(statusValue) || !statusValue;
        
        if ((name.includes(searchValue) || document.includes(searchValue)) && status) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// Cargar notificaciones al cargar la página
loadNotifications();
