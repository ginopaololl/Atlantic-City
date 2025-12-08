// ============================================
// SISTEMA DE AUTENTICACION CLIENTE (Simulado)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkLoginState();
    
    // Setup Register Listener
    const registerForm = document.getElementById('formRegistro');
    if(registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Setup Login Listener
    const loginForm = document.getElementById('form-login');
    if(loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// --- REGISTRO ---
function handleRegister(e) {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem('clientUsers')) || [];

    // Capturar datos
    const newUser = {
        nombres: document.getElementById('nombres').value.trim(),
        apellidos: document.getElementById('primer_apellido').value.trim() + ' ' + (document.getElementById('segundo_apellido').value.trim() || ''),
        docType: document.getElementById('documento').value,
        docNum: document.getElementById('dni').value.trim(),
        fechaNac: document.getElementById('fecha_nacimiento').value,
        celular: document.getElementById('celular').value.trim(),
        email: document.getElementById('correo').value.trim(),
        pass: document.getElementById('contraseña_registrar').value.trim(),
        fechaRegistro: new Date().toISOString()
    };

    // Validaciones basicas
    if(users.some(u => u.email === newUser.email)) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'El correo ya está registrado.' });
        return;
    }
    if(users.some(u => u.docNum === newUser.docNum)) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'El documento ya está registrado.' });
        return;
    }

    // Guardar
    users.push(newUser);
    localStorage.setItem('clientUsers', JSON.stringify(users));

    Swal.fire({
        icon: 'success',
        title: '¡Registro Exitoso!',
        text: 'Ahora puedes iniciar sesión.',
        confirmButtonColor: '#ffc107'
    }).then(() => {
        // Cerrar modal registro y abrir login
        const modalReg = bootstrap.Modal.getInstance(document.getElementById('registrar'));
        if(modalReg) modalReg.hide();
        
        const modalLogin = new bootstrap.Modal(document.getElementById('iniciosesion'));
        modalLogin.show();
    });

    document.getElementById('formRegistro').reset();
}

// --- LOGIN ---
function handleLogin(e) {
    e.preventDefault();

    const emailUser = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    
    const users = JSON.parse(localStorage.getItem('clientUsers')) || [];

    // Buscar usuario (por correo o DNI si se usara usuario, aqui usaremos correo)
    const validUser = users.find(u => u.email === emailUser && u.pass === pass);

    if(validUser) {
        // Iniciar Sesion
        localStorage.setItem('currentUser', JSON.stringify(validUser));
        
        Swal.fire({
            icon: 'success',
            title: 'Bienvenido ' + validUser.nombres,
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            location.reload(); // Recargar para actualizar header
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Credenciales Incorrectas',
            text: 'Verifica tu correo y contraseña.'
        });
    }
}

// --- ESTADO DE SESION ---
function checkLoginState() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const navAuthContainer = document.querySelector('.auth-buttons-container'); // Need to add this class to index.html header div
    
    // Si estamos en index.html y existe el contenedor de botones
    const btnRegister = document.querySelector('[data-bs-target="#registrar"]');
    
    if(user && btnRegister) {
        // Estamos logueados, reemplazar boton Registro por Perfil
        const parent = btnRegister.parentNode;
        
        // Ocultar botones originales
        // Nota: Esto depende de la estructura exacta. Lo haremos manipulando el DOM directo.
        // Buscamos el div que contiene los botones de Login/Registro
        const headerContainer = document.querySelector('header .d-flex.align-items-center.gap-2'); // Ajustar selector

        if(headerContainer) {
            headerContainer.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-warning dropdown-toggle text-white border-k" type="button" data-bs-toggle="dropdown">
                        <i class="fa-solid fa-user-circle me-1"></i> ${user.nombres}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end">
                        <li class="px-3 py-2 border-bottom border-secondary">
                            <small class="text-muted">Balance</small><br>
                            <span class="text-warning fw-bold">S/. ${localStorage.getItem('userBalance') || '1000.00'}</span>
                        </li>
                        <li><a class="dropdown-item" href="#"><i class="fa fa-user me-2"></i> Mi Perfil</a></li>
                        <li><a class="dropdown-item" href="#"><i class="fa fa-history me-2"></i> Historial</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="fa fa-sign-out-alt me-2"></i> Cerrar Sesión</a></li>
                    </ul>
                </div>
            `;
        }
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// --- AUTH GUARD (Para Casino y Juegos) ---
function requireAuth(actionName) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(!user) {
        Swal.fire({
            title: 'Inicia Sesión',
            text: `Para ${actionName}, necesitas una cuenta.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Iniciar Sesión',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#fcd62e',
            cancelButtonColor: '#333'
        }).then((result) => {
            if (result.isConfirmed) {
                // Redirigir a index y abrir modal login (Podríamos pasar parametro URL)
                if(window.location.pathname.includes('index.html')) {
                    const modal = new bootstrap.Modal(document.getElementById('iniciosesion'));
                    modal.show();
                } else {
                    window.location.href = 'index.html?login=true';
                }
            }
        });
        return false;
    }
    return true;
}

// Auto-open login if param exists
if(new URLSearchParams(window.location.search).get('login') === 'true') {
    window.onload = () => {
        const modal = new bootstrap.Modal(document.getElementById('iniciosesion'));
        modal.show();
    }
}
