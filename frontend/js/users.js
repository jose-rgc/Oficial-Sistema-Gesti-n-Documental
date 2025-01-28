// URL base del backend
const apiBaseUrl = 'http://localhost:3000';

// Función para cargar los usuarios
async function loadUsers() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('No estás autenticado. Por favor, inicia sesión.');
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/users`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }

        const users = await response.json();
        const tbody = document.getElementById('usersTable').querySelector('tbody');
        tbody.innerHTML = ''; // Limpiar la tabla

        users.forEach((user) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>
                    <button class="edit-button" data-id="${user._id}">Editar</button>
                    <button class="delete-button" data-id="${user._id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Asignar eventos a los botones
        document.querySelectorAll('.edit-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                console.log('ID del usuario al hacer clic en Editar:', userId);
                openModal(userId);
            });
        });

        document.querySelectorAll('.delete-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                deleteUser(userId);
            });
        });
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

// Función para abrir el modal
async function openModal(userId = null) {
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const roleField = document.getElementById('role');
    const userForm = document.getElementById('userForm');

    // Mostrar modal y formulario
    modal.classList.add('show');
    userForm.style.display = 'block';

    if (userId) {
        // Editar Usuario
        modalTitle.textContent = 'Editar Usuario';
        passwordField.parentElement.style.display = 'none'; // Ocultar contraseña al editar
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('No se pudieron obtener los datos del usuario');
            }

            const user = await response.json();
            usernameField.value = user.username || '';
            roleField.value = user.role || '';
        } catch (error) {
            console.error('Error al cargar usuario:', error);
            alert('Hubo un problema al cargar los datos del usuario.');
            modal.classList.remove('show');
        }

        userForm.onsubmit = (e) => {
            e.preventDefault();
            updateUser(userId);
        };
    } else {
        // Crear Usuario
        modalTitle.textContent = 'Agregar Usuario';
        passwordField.parentElement.style.display = 'block'; // Mostrar contraseña
        usernameField.value = '';
        passwordField.value = '';
        roleField.value = 'user';

        userForm.onsubmit = (e) => {
            e.preventDefault();
            createUser();
        };
    }
}
// Agregar evento al botón "Agregar Usuario"
document.getElementById('addUserButton').addEventListener('click', () => {
    console.log("Botón 'Agregar Usuario' presionado.");
    openModal(); // Llama a openModal sin pasar ningún argumento para crear un usuario
});

// Función para cerrar el modal
document.getElementById('closeModal').addEventListener('click', () => {
    const modal = document.getElementById('userModal');
    modal.classList.remove('show'); // Ocultar el modal usando la clase
    console.log("Modal ocultado, clase 'show' eliminada");
});

async function createUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
     // Validaciones
     if (username === '') {
        alert('El campo "Usuario" no puede estar vacío.');
        return;
    }

    if (password === '' || password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    if (role !== 'admin' && role !== 'user') {
        alert('El rol seleccionado no es válido.');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiBaseUrl}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ username, password, role }),
        });

        if (!response.ok) {
            throw new Error('Error al crear el usuario');
        }

        showNotification('Usuario creado exitosamente');
        const modal = document.getElementById('userModal');
        modal.classList.remove('show'); // Cerrar el modal
        loadUsers(); // Recargar la tabla de usuarios
    } catch (error) {
        console.error('Error al crear usuario:', error);
        alert('Hubo un error al intentar crear el usuario.');
    }
}



// Función para actualizar un usuario
async function updateUser(userId) {
    const username = document.getElementById('username').value;
    const role = document.getElementById('role').value;

    console.log('Actualizando usuario:', userId);
    console.log('Valores enviados al backend:');
    console.log('Username:', username);
    console.log('Role:', role);

    // Validaciones
    if (username === '') {
        alert('El campo "Usuario" no puede estar vacío.');
        return;
    }

    if (role !== 'admin' && role !== 'user') {
        alert('El rol seleccionado no es válido.');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        console.log('Token autenticación:', token);

        const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ username, role }),
        });

        console.log('Respuesta del backend al actualizar usuario:', response);

        if (!response.ok) {
            throw new Error('Error al actualizar el usuario');
        }

        showNotification('Usuario actualizado exitosamente');
        document.getElementById('userModal').classList.remove('show'); // Cerrar modal
        loadUsers(); // Recargar tabla de usuarios
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        alert('Hubo un error al intentar actualizar el usuario.');
    }
}


// Función para eliminar un usuario
async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el usuario');
        }

        alert('Usuario eliminado exitosamente');
        loadUsers();
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
    }
}
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type === 'error' ? 'error' : ''}`;
    setTimeout(() => {
        notification.className = 'notification'; // Ocultar notificación
    }, 3000);
}

// Cargar usuarios al inicio
loadUsers();
