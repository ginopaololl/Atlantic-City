document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DE USUARIO (CLIENTE) ---
    // Manejo básico de sesión para el chat
    const btnLoginUser = document.querySelector('.btn-iniciar');
    const btnRegisterUser = document.querySelector('.btn-registrar');

    if(btnLoginUser) {
        btnLoginUser.addEventListener('click', () => {
             // Simulación Login Usuario
             const userField = document.querySelector('#usuario').value;
             if(userField) {
                 const mockUser = { nombres: userField, tipo: 'Registrado' };
                 localStorage.setItem('userSession', JSON.stringify(mockUser));
                 alert(`Bienvenido ${userField}`);
                 location.reload(); 
             }
        });
    }
    
    // Verificar sesión al inicio
    let currentUser = 'Invitado';
    const session = JSON.parse(localStorage.getItem('userSession')); 
    if(session && session.nombres) {
        currentUser = session.nombres;
        // Opcional: Actualizar UI de botón login
        const btnUser = document.querySelector('.btn-user');
        if(btnUser) btnUser.textContent = currentUser;
    }

    // --- CHAT WIDGET ---
    const chatBtn = document.getElementById('chat-widget-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close-btn');
    const sendBtn = document.getElementById('chat-send-btn');
    const chatInput = document.getElementById('chat-input');
    const chatBody = document.getElementById('chat-body');

    // --- SESIÓN DE CHAT ---
    // Generar ID único de sesión si no existe
    let sessionId = localStorage.getItem('chatSessionId');
    if(!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatSessionId', sessionId);
    }

    // Cargar historial
    loadChatHistory();

    // Toggle ventana
    chatBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
        if(chatWindow.classList.contains('active')) {
            chatInput.focus();
            scrollToBottom();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    // Enviar mensaje
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
        const text = chatInput.value.trim();
        if(!text) return;

        // 1. Renderizar mensaje usuario
        const msgObj = {
            id: Date.now(),
            sender: currentUser,
            role: 'user', // user | moderator
            text: text,
            timestamp: new Date().toISOString()
        };

        saveMessage(msgObj);
        renderMessage(msgObj);
        chatInput.value = '';
        scrollToBottom();

        // 2. Simular respuesta automatica (si aplica)
        handleAutoResponse();
    }

    function renderMessage(msg) {
        const div = document.createElement('div');
        div.classList.add('message', msg.role === 'user' ? 'user' : 'moderator');
        
        // Formato de hora
        const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        div.innerHTML = `
            <div class="message-info">${msg.sender} • ${time}</div>
            ${msg.text}
        `;
        chatBody.appendChild(div);
    }

    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // --- NUEVO FORMATO DE GUARDADO (Multi-Cliente) ---
    function saveMessage(msg) {
        const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
        
        // Si la sesión no existe, iniciarla
        if (!sessions[sessionId]) {
            sessions[sessionId] = {
                user: currentUser,
                messages: [],
                lastActive: Date.now(),
                unread: true // Flag para el moderador
            };
        }

        sessions[sessionId].messages.push(msg);
        sessions[sessionId].lastActive = Date.now();
        sessions[sessionId].unread = (msg.role === 'user'); // Marcar no leído si escribe usuario
        
        // Actualizar nombre si cambió (de Invitado a Registrado)
        sessions[sessionId].user = currentUser;

        localStorage.setItem('chatSessions', JSON.stringify(sessions));
    }

    function loadChatHistory() {
        const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
        const mySession = sessions[sessionId];
        const history = mySession ? mySession.messages : [];

        const currentMsgCount = chatBody.querySelectorAll('.message:not(.initial)').length; 
        
        if (history.length !== currentMsgCount) {
             // Guardar posición
            const wasAtBottom = (chatBody.scrollHeight - chatBody.scrollTop) <= (chatBody.clientHeight + 50);

            chatBody.innerHTML = ''; 
            
            // Mensaje de bienvenida fix
            const div = document.createElement('div');
            div.classList.add('message', 'moderator', 'initial'); 
            div.innerHTML = `<div class="message-info">Sistema</div>¡Hola! Bienvenido a Atlantic City. ¿En qué podemos ayudarte hoy?`;
            chatBody.appendChild(div);

            history.forEach(msg => renderMessage(msg));

            if (wasAtBottom || currentMsgCount === 0) {
                scrollToBottom();
            }
        }
    }

    // Polling
    setInterval(() => {
        if(chatWindow.classList.contains('active')) {
            loadChatHistory();
        }
    }, 3000);

    function handleAutoResponse() {
        const sessions = JSON.parse(localStorage.getItem('chatSessions')) || {};
        const mySession = sessions[sessionId];
        const history = mySession ? mySession.messages : [];
        
        // Obtener último mensaje del USUARIO
        const userMsgs = history.filter(m => m.role === 'user');
        const lastUserMsg = userMsgs[userMsgs.length - 1];
        
        // Último mensaje global
        const lastMsg = history[history.length - 1];
        if(lastMsg && lastMsg.role === 'moderator') return; // Ya se respondió

        // Validar tiempo (30 mins) o Primer mensaje
        const now = new Date();
        const lastTime = userMsgs.length > 1 ? new Date(userMsgs[userMsgs.length - 2].timestamp) : new Date(0);
        const minutesDiff = Math.floor((now - lastTime) / 60000);

        if (history.length === 1 || minutesDiff > 30) {
             setTimeout(() => {
                const autoReply = {
                    id: Date.now(),
                    sender: 'Sistema',
                    role: 'moderator',
                    text: `Hola, recibimos tu consulta: "${limitText(lastUserMsg.text)}".<br>Un asesor se estará comunicando contigo en breve. Por favor espera un momento.`,
                    timestamp: new Date().toISOString()
                };
                saveMessage(autoReply);
                loadChatHistory();
            }, 1000);
        }
    }

    function limitText(text) {
        return text.length > 20 ? text.substring(0, 20) + '...' : text;
    }

});
