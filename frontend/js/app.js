document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');

            try {
                const response = await fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Usuario o contraseña incorrectos');
                }

                const data = await response.json();
                localStorage.setItem('authToken', data.token);
                window.location.href = 'dashboard.html';
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
            }
        });
    }

    if (window.location.pathname.endsWith('dashboard.html')) {
        const token = localStorage.getItem('authToken');

        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = 'index.html';
        } else {
            const payload = JSON.parse(atob(token.split('.')[1]));

            // SELECCIONAMOS LOS ELEMENTOS CORRECTOS PARA MOSTRAR USUARIO Y ROL
            const usernameElement = document.getElementById('usernameDisplay');
            const roleElement = document.getElementById('userRoleDisplay');

            if (usernameElement && roleElement) {
                usernameElement.textContent = payload.username; // Nombre del usuario
                roleElement.textContent = payload.role; // Rol del usuario
            } else {
                console.error("No se encontraron los elementos usernameDisplay o userRoleDisplay.");
            }
        }

        const logoutButton = document.querySelector('.logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('authToken');
                window.location.href = 'index.html';
            });
        }
    }
});
