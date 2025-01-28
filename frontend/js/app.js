document.addEventListener('DOMContentLoaded', () => {
    // Aquí todo tu código
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

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
                    throw new Error(errorData.message || 'Error desconocido');
                }

                const data = await response.json();
                localStorage.setItem('authToken', data.token);

                // Redirigir al dashboard
                window.location.href = 'dashboard.html';
            } catch (error) {
                document.getElementById('errorMessage').textContent = error.message;
            }
        });
    }

    // Verificar si el usuario está autenticado al cargar el dashboard
    if (window.location.pathname.endsWith('dashboard.html')) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = 'index.html';
        } else {
            const payload = JSON.parse(atob(token.split('.')[1]));
            document.getElementById('userInfo').textContent = `Usuario: ${payload.username} | Rol: ${payload.role}`;
        }

        // Manejar cierre de sesión
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('authToken');
                window.location.href = 'index.html';
            });
        }
    }
});
