// ============================================
// LOGICA DEL MODERADOR
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES DE UI ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('admin-login-form');
    const registerForm = document.getElementById('admin-register-form');
    const btnShowRegister = document.getElementById('btn-show-register');
    const btnShowLogin = document.getElementById('btn-show-login');
    const btnLogout = document.getElementById('btn-logout');

    // --- MOCK DATABASE (localStorage) ---
    // Si no existe usuario admin, creamos uno por defecto
    if (!localStorage.getItem('adminUsers')) {
        const defaultAdmin = [{ 
            nombres: 'Administrador', 
            apellidos: 'Principal',
            email: 'admin@atlanticcity.com', 
            cargo: 'Super Admin',
            telefono: '999000999',
            docType: 'DNI',
            docNum: '00000000',
            pass: '1234',
            fechaIngreso: new Date().toLocaleDateString(),
            estado: 'Conectado'
        }];
        localStorage.setItem('adminUsers', JSON.stringify(defaultAdmin));
    }

    // --- LOGIN / REGISTER FLOW ---

    // Mostrar form de registro
    btnShowRegister.addEventListener('click', () => {
        loginForm.classList.add('d-none');
        registerForm.classList.remove('d-none');
    });

    // Volver al login
    btnShowLogin.addEventListener('click', () => {
        registerForm.classList.add('d-none');
        loginForm.classList.remove('d-none');
    });

    // Iniciar Sesión
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputEmail = document.getElementById('admin-user').value.trim();
        const inputPass = document.getElementById('admin-pass').value.trim();

        // Validar Dominio
        if (!inputEmail.endsWith('@atlanticcity.com')) {
             Swal.fire({
                icon: 'error',
                title: 'Correo Inválido',
                text: 'Solo se permiten correos corporativos (@atlanticcity.com)',
                confirmButtonColor: '#fcd62e',
                confirmButtonText: '<span style="color:black">Entendido</span>'
            });
            return;
        }

        const storedUsers = JSON.parse(localStorage.getItem('adminUsers')) || [];
        
        // LOGIN SOLO CON CORREO
        const validUser = storedUsers.find(u => u.email === inputEmail && u.pass === inputPass);

        if (validUser) {
            // Simular "Conectado"
            validUser.estado = 'Conectado'; 
            localStorage.setItem('adminUsers', JSON.stringify(storedUsers));
            enterDashboard(validUser);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Acceso Denegado',
                text: 'Correo corporativo o contraseña incorrectos',
                confirmButtonColor: '#fcd62e',
                confirmButtonText: '<span style="color:black">Reintentar</span>'
            });
        }
    });

    // Registrar Usuario
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Captura de datos
        const nombres = document.getElementById('reg-name').value.trim();
        const apellidos = document.getElementById('reg-lastname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const cargo = document.getElementById('reg-job').value.trim();
        const telefono = document.getElementById('reg-phone').value.trim();
        const docType = document.getElementById('reg-doc-type').value;
        const docNum = document.getElementById('reg-doc-num').value.trim();
        const pass = document.getElementById('reg-pass').value.trim();
        const masterCode = document.getElementById('reg-master-code').value.trim();
        
        // --- VALIDACION DOMINIO ---
        if (!email.endsWith('@atlanticcity.com')) {
            Swal.fire({ 
                icon: 'error', 
                title: 'Correo Inválido', 
                text: 'El registro es exclusivo para correos @atlanticcity.com',
                confirmButtonColor: '#fcd62e',
                confirmButtonText: '<span style="color:black">Corregir</span>'
            });
            return;
        }

        // --- VALIDACION CODIGO MAESTRO ---
        if (masterCode !== '0000') {
            Swal.fire({ 
                icon: 'error', 
                title: 'Código Inválido', 
                text: 'El código maestro es incorrecto.',
                confirmButtonColor: '#fcd62e',
                confirmButtonText: '<span style="color:black">Reintentar</span>'
            });
            return;
        }

        const storedUsers = JSON.parse(localStorage.getItem('adminUsers')) || [];
        
        // Validar si existe Email
        if (storedUsers.some(u => u.email === email)) {
            Swal.fire({ icon: 'warning', title: 'Correo registrado', text: 'Este correo corporativo ya tiene una cuenta.' });
            return;
        }

        // Crear Objeto Usuario Completo
        const newUserObj = {
            nombres,
            apellidos,
            email,
            cargo,
            telefono,
            docType,
            docNum,
            pass,
            fechaIngreso: new Date().toLocaleDateString(), // Fecha actual automática
            estado: 'Desconectado' // Estado inicial
        };

        storedUsers.push(newUserObj);
        localStorage.setItem('adminUsers', JSON.stringify(storedUsers));

        Swal.fire({
            icon: 'success',
            title: 'Registro Exitoso',
            text: 'Cuenta de moderador creada correctamente.',
            confirmButtonColor: '#fcd62e',
             confirmButtonText: '<span style="color:black">Ir al Login</span>'
        }).then(() => {
            btnShowLogin.click();
        });
    });

    // --- DASHBOARD LOGIC ---

    function enterDashboard(userData) {
        loginSection.classList.add('d-none');
        dashboardSection.classList.remove('d-none');
        
        // Actualizar UI del Dashboard con datos reales
        const userNameDisplay = document.querySelector('#dropdownUser1 strong');
        if(userNameDisplay) userNameDisplay.textContent = userData.nombres; 

        // --- VERIFICAR ROL GERENTE ---
        // Se normaliza a minúsculas para comparar
        if (userData.cargo.toLowerCase().includes('gerente')) {
            // Mostrar Tab Equipo en sidebar
            const navItemEquipo = document.getElementById('nav-item-equipo');
            if(navItemEquipo) navItemEquipo.classList.remove('d-none');
            
            // Cargar datos del equipo
            loadTeamData();
        }

        // Mensaje de bienvenida
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });
        Toast.fire({
            icon: 'success',
            title: `Hola, ${userData.nombres}`,
            text: `Cargo: ${userData.cargo} | Estado: ${userData.estado}`
        });
    }

    // --- FUNCIÓN PARA CARGAR EQUIPO (SOLO GERENTES) ---
    function loadTeamData() {
        const storedUsers = JSON.parse(localStorage.getItem('adminUsers')) || [];
        const tbody = document.querySelector('#team-table tbody');
        if(!tbody) return;

        tbody.innerHTML = ''; // Limpiar tabla

        storedUsers.forEach(user => {
            // Generar actividad random para demo
            const actividades = [
                'Editó Banner Principal',
                'Agregó juego "Zeus"',
                'Actualizó Promoción',
                'Revisión de métricas',
                'Conexión reciente'
            ];
            const randomActivity = actividades[Math.floor(Math.random() * actividades.length)];
            const randomTime = Math.floor(Math.random() * 59) + 1; // 1 a 60 min

            const row = `
                <tr>
                    <td>${user.nombres} ${user.apellidos || ''}</td>
                    <td><span class="badge bg-warning text-dark">${user.cargo}</span></td>
                    <td>${user.email}</td>
                    <td>${user.telefono || '-'}</td>
                    <td>${user.fechaIngreso || 'N/A'}</td>
                    <td><span class="badge ${user.estado === 'Conectado' ? 'bg-success' : 'bg-secondary'}">${user.estado}</span></td>
                    <td class="text-muted small">
                        <i class="fa fa-history text-gold"></i> ${randomActivity}<br>
                        Hace ${randomTime} min
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    // Logout
    if(btnLogout){
        btnLogout.addEventListener('click', () => {
            // (Opcional) cambiar estado a desconectado en logout
            dashboardSection.classList.add('d-none');
            loginSection.classList.remove('d-none');
            loginForm.reset();
        });
    }

    // --- TAB SWITCHING ---
    window.switchTab = function(tabName) {
        // Ocultar todos los tabs
        document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.add('d-none'));
        // Mostrar el seleccionado
        document.getElementById(`tab-${tabName}`).classList.remove('d-none');
        
        // Actualizar activo en sidebar
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
            // Check simple si el texto coincide con el tab
            if(link.getAttribute('onclick').includes(tabName)) {
                link.classList.add('active');
            }
        });

        // Hooks por tab
        if(tabName === 'chat') {
            loadAdminChat();
        } else if (tabName === 'usuarios') {
            loadUsers();
        }
    };

    // --- CARGAR USUARIOS (CLIENTES) ---
    window.loadUsers = function() {
        const users = JSON.parse(localStorage.getItem('clientUsers')) || [];
        const tbody = document.getElementById('users-table-body');
        if(!tbody) return;

        tbody.innerHTML = '';
        
        if(users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios registrados</td></tr>';
            return;
        }

        users.forEach(u => {
            const row = `
                <tr>
                    <td>
                        <div class="fw-bold">${u.nombres} ${u.apellidos || ''}</div>
                        <small class="text-muted"><i class="fa-solid fa-envelope"></i> ${u.email}</small>
                    </td>
                    <td>
                        <span class="badge bg-secondary">${u.docType || 'DNI'}</span> ${u.docNum}
                    </td>
                    <td>${u.celular || '-'}</td>
                    <td>${new Date(u.fechaRegistro).toLocaleDateString()}</td>
                    <td>
                        ${u.lastLogin 
                            ? `<span class="text-success"><i class="fa-solid fa-check-circle"></i> ${new Date(u.lastLogin).toLocaleString()}</span>` 
                            : '<span class="text-secondary">Nunca</span>'}
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    // --- CHAT MODERADOR PRO (MULTI-CLIENTE) ---
    let chatRefreshInterval = null;
    let selectedSessionId = null;

    function loadAdminChat() {
        const sessionListEl = document.getElementById('chat-session-list');
        const chatBodyEl = document.getElementById('admin-chat-body');
        const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
        
        // 1. Renderizar Lista de Sesiones
        sessionListEl.innerHTML = '';
        const sessionIds = Object.keys(sessions);

        if (sessionIds.length === 0) {
            sessionListEl.innerHTML = '<div class="text-center text-muted mt-4 small">Esperando chats...</div>';
        } else {
            // Ordenar por actividad reciente
            sessionIds.sort((a, b) => sessions[b].lastActive - sessions[a].lastActive);

            sessionIds.forEach(sid => {
                const s = sessions[sid];
                const lastMsg = s.messages.length > 0 ? s.messages[s.messages.length - 1].text : 'Nueva sesión';
                const time = new Date(s.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const isActive = (sid === selectedSessionId);
                
                // Item de la lista
                const div = document.createElement('div');
                div.className = `p-2 border-bottom border-secondary mb-1 cursor-pointer ${isActive ? 'bg-secondary bg-opacity-50' : 'bg-dark text-muted'}`;
                div.style.cursor = 'pointer';
                div.onclick = () => selectSession(sid);
                
                div.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <strong class="${isActive ? 'text-white' : 'text-secondary-emphasis'}">${s.user}</strong>
                        <small style="font-size:0.7rem">${time}</small>
                    </div>
                    <div class="small text-truncate ${s.unread ? 'text-warning fw-bold' : ''}" style="max-width: 150px;">
                        ${s.unread ? '<i class="fa-solid fa-circle small me-1"></i>' : ''} ${lastMsg}
                    </div>
                `;
                sessionListEl.appendChild(div);
            });
        }

        // 2. Renderizar Chat Seleccionado
        if (selectedSessionId && sessions[selectedSessionId]) {
            const currentSession = sessions[selectedSessionId];
            
            // Actualizar Header
            document.getElementById('current-chat-header').classList.remove('d-none');
            document.getElementById('current-chat-user').textContent = currentSession.user;
            
            // Format ID nicely
            const shortId = selectedSessionId.substring(0, 6).toUpperCase();
            document.getElementById('current-chat-id').innerHTML = `<i class="fa-solid fa-hashtag mb-0"></i> ID: ${shortId}`;

            // Habilitar Inputs
            document.getElementById('admin-chat-input').disabled = false;
            document.getElementById('admin-chat-send').disabled = false;

            // Render Messages
            // Comparamos si cambió la cantidad para evitar parpadeo o render completo innecesario (simple render en este demo)
            // Para mantener scroll, guardamos posición.
            const previousScroll = chatBodyEl.scrollTop;
            const wasAtBottom = (chatBodyEl.scrollHeight - chatBodyEl.scrollTop) === chatBodyEl.clientHeight;

            chatBodyEl.innerHTML = '';
            
            if(currentSession.messages.length === 0) {
                 chatBodyEl.innerHTML = '<div class="text-muted text-center mt-5">Inicio de la conversación.</div>';
            } else {
                currentSession.messages.forEach(msg => {
                    const isMod = msg.role === 'moderator';
                    const div = document.createElement('div');
                    
                    // CONTRASTE FIX: Textos blancos para leer sobre fondo oscuro
                    div.className = `p-2 mb-2 rounded ${isMod ? 'bg-secondary text-end ms-auto border border-secondary' : 'bg-black text-start me-auto border border-dark'}`;
                    div.style.maxWidth = '80%';
                    
                    const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    div.innerHTML = `
                        <div class="small fw-bold ${isMod ? 'text-warning' : 'text-info'}">${msg.sender}</div>
                        <div class="text-white">${msg.text}</div>
                        <div class="small text-muted text-opacity-50" style="font-size:0.7rem">${time}</div>
                    `;
                    chatBodyEl.appendChild(div);
                });
            }

            // Scroll al fondo solo si estaba abajo o es primera carga
            if (wasAtBottom) chatBodyEl.scrollTop = chatBodyEl.scrollHeight;
            else chatBodyEl.scrollTop = previousScroll;

        } else {
            // Estado vacío (ningún chat seleccionado)
            document.getElementById('current-chat-header').classList.add('d-none');
            document.getElementById('admin-chat-input').disabled = true;
            document.getElementById('admin-chat-send').disabled = true;
            if(!selectedSessionId) { // Solo si no hay ID, si hay ID inválido se limpia
                 chatBodyEl.innerHTML = `
                    <div class="h-100 d-flex align-items-center justify-content-center text-muted">
                        <div class="text-center">
                            <i class="fa-solid fa-comment-slash fa-3x mb-3 opacity-25"></i>
                            <p>Selecciona un chat para comenzar</p>
                        </div>
                    </div>`;
            }
        }

        // Auto Refresh
        if(!chatRefreshInterval) {
            chatRefreshInterval = setInterval(() => {
                if(!document.getElementById('tab-chat').classList.contains('d-none')) {
                    loadAdminChat();
                }
            }, 3000);
        }
    }

    function selectSession(sid) {
        selectedSessionId = sid;
        
        // Marcar como leído
        const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
        if(sessions[sid]) {
            sessions[sid].unread = false;
            localStorage.setItem('chatSessions', JSON.stringify(sessions));
        }
        
        loadAdminChat();
        // Scroll al fondo al seleccionar
        const chatBodyEl = document.getElementById('admin-chat-body');
        setTimeout(() => chatBodyEl.scrollTop = chatBodyEl.scrollHeight, 50);
    }

    // Event Listeners para Enviar (solo se agregan una vez)
    const btnSendAdmin = document.getElementById('admin-chat-send');
    if(btnSendAdmin && !btnSendAdmin.hasAttribute('listener-added')) {
        btnSendAdmin.setAttribute('listener-added', 'true');
        btnSendAdmin.addEventListener('click', sendAdminReply);
    }
    
    // Permitir Enter
    const inputAdminChat = document.getElementById('admin-chat-input');
    if(inputAdminChat && !inputAdminChat.hasAttribute('listener-added')) {
        inputAdminChat.setAttribute('listener-added', 'true');
        inputAdminChat.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') sendAdminReply();
        });
    }

    function sendAdminReply() {
        if (!selectedSessionId) return;

        const input = document.getElementById('admin-chat-input');
        const text = input.value.trim();
        if(!text) return;

        // Obtener nombre del moderador actual
        let modName = 'Moderador';
        const userNameDisplay = document.querySelector('#dropdownUser1 strong');
        if(userNameDisplay) modName = userNameDisplay.textContent;

        const replyObj = {
            id: Date.now(),
            sender: modName, 
            role: 'moderator',
            text: text,
            timestamp: new Date().toISOString()
        };

        const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
        if(sessions[selectedSessionId]) {
            sessions[selectedSessionId].messages.push(replyObj);
            sessions[selectedSessionId].lastActive = Date.now();
            localStorage.setItem('chatSessions', JSON.stringify(sessions));
        }

        input.value = '';
        loadAdminChat(); 
        
        // Scroll bottom force
        const chatBodyEl = document.getElementById('admin-chat-body');
        setTimeout(() => chatBodyEl.scrollTop = chatBodyEl.scrollHeight, 50);
    }

    // --- MOCK SAVE ACTIONS ---
    window.saveChanges = function(e, section) {
        e.preventDefault();
        
        // Simulación de guardado
        Swal.fire({
            title: '¿Guardar Cambios?',
            text: `Se actualizará la sección: ${section}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#fcd62e',
            cancelButtonColor: '#333',
            confirmButtonText: '<span style="color:black">Sí, guardar</span>',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'Los cambios se han aplicado correctamente en el sitio.',
                    icon: 'success',
                    confirmButtonColor: '#fcd62e',
                    confirmButtonText: '<span style="color:black">Excelente</span>'
                });
                // Aquí iría la lógica real de backend o manipulación de DOM si fuera SPA real
            }
        });
    }

});
