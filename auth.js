// ==================== CONFIGURACIÓN COGNITO ====================
// ⚠️ REEMPLAZA ESTOS VALORES con los de tu User Pool de Cognito
const COGNITO_CONFIG = {
    userPoolId: 'us-east-2_9kLs4Wpwf',          // Ej: us-east-2_AbCdEfGhI
    clientId: '71v470nu846ktm809lab4ktb30',           // Ej: 1abc2defghij3klmnopqrs4tu
    region: 'us-east-2'
};

// ==================== ESTADO DE SESIÓN ====================
let appMode = null; // 'real' | 'demo'
let currentUser = null;
let cognitoTokens = null;

// ==================== DATOS DEMO ====================
const DEMO_DATA = {
    routines: {
        "pecho_triceps": {
            name: "Pecho y Tríceps",
            exercises: [
                { id: "ex_pt1", name: "Press Banca con Barra" },
                { id: "ex_pt2", name: "Press Inclinado con Mancuernas" },
                { id: "ex_pt3", name: "Aperturas con Mancuernas" },
                { id: "ex_pt4", name: "Fondos en Paralelas" },
                { id: "ex_pt5", name: "Extensión Tríceps en Polea" },
                { id: "ex_pt6", name: "Press Declinado" }
            ]
        },
        "espalda_biceps": {
            name: "Espalda y Bíceps",
            exercises: [
                { id: "ex_eb1", name: "Jalón al Pecho" },
                { id: "ex_eb2", name: "Remo con Barra" },
                { id: "ex_eb3", name: "Remo en Polea Baja" },
                { id: "ex_eb4", name: "Curl Bíceps con Barra" },
                { id: "ex_eb5", name: "Curl Martillo" },
                { id: "ex_eb6", name: "Face Pull" },
                { id: "ex_eb7", name: "Pull-Ups" }
            ]
        },
        "pierna": {
            name: "Pierna",
            exercises: [
                { id: "ex_p1", name: "Sentadilla con Barra" },
                { id: "ex_p2", name: "Prensa de Piernas" },
                { id: "ex_p3", name: "Extensión de Cuádriceps" },
                { id: "ex_p4", name: "Femoral Tumbado" },
                { id: "ex_p5", name: "Zancadas con Mancuernas" },
                { id: "ex_p6", name: "Pantorrilla de Pie" },
                { id: "ex_p7", name: "Hip Thrust" }
            ]
        },
        "hombro": {
            name: "Hombro",
            exercises: [
                { id: "ex_h1", name: "Press Militar con Barra" },
                { id: "ex_h2", name: "Elevaciones Laterales" },
                { id: "ex_h3", name: "Elevaciones Frontales" },
                { id: "ex_h4", name: "Pájaro con Mancuernas" },
                { id: "ex_h5", name: "Encogimientos con Barra" },
                { id: "ex_h6", name: "Press Arnold" }
            ]
        },
        "full_body": {
            name: "Full Body",
            exercises: [
                { id: "ex_fb1", name: "Peso Muerto" },
                { id: "ex_fb2", name: "Sentadilla Goblet" },
                { id: "ex_fb3", name: "Press Banca" },
                { id: "ex_fb4", name: "Remo con Mancuerna" },
                { id: "ex_fb5", name: "Press Militar" },
                { id: "ex_fb6", name: "Curl Bíceps" }
            ]
        }
    },
    workoutHistory: [
        {
            id: "demo_1", date: "2025-11-01", routine: "pecho_triceps",
            exercises: [
                { name: "Press Banca con Barra", series: [{weight:60,reps:10},{weight:65,reps:8},{weight:67.5,reps:6}] },
                { name: "Press Inclinado con Mancuernas", series: [{weight:24,reps:10},{weight:26,reps:8},{weight:26,reps:7}] },
                { name: "Extensión Tríceps en Polea", series: [{weight:20,reps:12},{weight:22,reps:10},{weight:22,reps:10}] }
            ]
        },
        {
            id: "demo_2", date: "2025-11-04", routine: "espalda_biceps",
            exercises: [
                { name: "Jalón al Pecho", series: [{weight:55,reps:12},{weight:60,reps:10},{weight:62.5,reps:8}] },
                { name: "Remo con Barra", series: [{weight:60,reps:10},{weight:65,reps:8},{weight:65,reps:7}] },
                { name: "Curl Bíceps con Barra", series: [{weight:30,reps:12},{weight:32.5,reps:10},{weight:32.5,reps:9}] }
            ]
        },
        {
            id: "demo_3", date: "2025-11-06", routine: "pierna",
            exercises: [
                { name: "Sentadilla con Barra", series: [{weight:80,reps:10},{weight:90,reps:8},{weight:95,reps:6}] },
                { name: "Prensa de Piernas", series: [{weight:120,reps:12},{weight:130,reps:10},{weight:140,reps:8}] },
                { name: "Femoral Tumbado", series: [{weight:35,reps:12},{weight:37.5,reps:10},{weight:37.5,reps:9}] }
            ]
        },
        {
            id: "demo_4", date: "2025-11-09", routine: "pecho_triceps",
            exercises: [
                { name: "Press Banca con Barra", series: [{weight:62.5,reps:10},{weight:67.5,reps:8},{weight:70,reps:6}] },
                { name: "Press Inclinado con Mancuernas", series: [{weight:26,reps:10},{weight:28,reps:8},{weight:28,reps:7}] },
                { name: "Extensión Tríceps en Polea", series: [{weight:22,reps:12},{weight:24,reps:10},{weight:24,reps:9}] }
            ]
        },
        {
            id: "demo_5", date: "2025-11-12", routine: "espalda_biceps",
            exercises: [
                { name: "Jalón al Pecho", series: [{weight:57.5,reps:12},{weight:62.5,reps:10},{weight:65,reps:8}] },
                { name: "Remo con Barra", series: [{weight:62.5,reps:10},{weight:67.5,reps:8},{weight:67.5,reps:7}] },
                { name: "Curl Bíceps con Barra", series: [{weight:32.5,reps:12},{weight:35,reps:10},{weight:35,reps:8}] }
            ]
        },
        {
            id: "demo_6", date: "2025-11-15", routine: "pierna",
            exercises: [
                { name: "Sentadilla con Barra", series: [{weight:85,reps:10},{weight:92.5,reps:8},{weight:100,reps:5}] },
                { name: "Prensa de Piernas", series: [{weight:130,reps:12},{weight:140,reps:10},{weight:150,reps:8}] },
                { name: "Femoral Tumbado", series: [{weight:37.5,reps:12},{weight:40,reps:10},{weight:40,reps:9}] }
            ]
        },
        {
            id: "demo_7", date: "2025-11-18", routine: "pecho_triceps",
            exercises: [
                { name: "Press Banca con Barra", series: [{weight:65,reps:10},{weight:70,reps:8},{weight:72.5,reps:6}] },
                { name: "Press Inclinado con Mancuernas", series: [{weight:28,reps:10},{weight:30,reps:8},{weight:30,reps:6}] },
                { name: "Extensión Tríceps en Polea", series: [{weight:24,reps:12},{weight:26,reps:10},{weight:26,reps:9}] }
            ]
        },
        {
            id: "demo_8", date: "2025-11-21", routine: "hombro",
            exercises: [
                { name: "Press Militar con Barra", series: [{weight:40,reps:10},{weight:45,reps:8},{weight:47.5,reps:6}] },
                { name: "Elevaciones Laterales", series: [{weight:10,reps:15},{weight:12,reps:12},{weight:12,reps:10}] },
                { name: "Pájaro con Mancuernas", series: [{weight:8,reps:15},{weight:10,reps:12},{weight:10,reps:10}] }
            ]
        },
        {
            id: "demo_9", date: "2025-11-25", routine: "espalda_biceps",
            exercises: [
                { name: "Jalón al Pecho", series: [{weight:60,reps:12},{weight:65,reps:10},{weight:67.5,reps:8}] },
                { name: "Remo con Barra", series: [{weight:65,reps:10},{weight:70,reps:8},{weight:70,reps:7}] },
                { name: "Curl Bíceps con Barra", series: [{weight:35,reps:12},{weight:37.5,reps:10},{weight:37.5,reps:8}] }
            ]
        },
        {
            id: "demo_10", date: "2025-11-28", routine: "pierna",
            exercises: [
                { name: "Sentadilla con Barra", series: [{weight:90,reps:10},{weight:97.5,reps:8},{weight:102.5,reps:5}] },
                { name: "Prensa de Piernas", series: [{weight:140,reps:12},{weight:150,reps:10},{weight:160,reps:8}] },
                { name: "Femoral Tumbado", series: [{weight:40,reps:12},{weight:42.5,reps:10},{weight:42.5,reps:8}] }
            ]
        },
        {
            id: "demo_11", date: "2025-12-02", routine: "pecho_triceps",
            exercises: [
                { name: "Press Banca con Barra", series: [{weight:67.5,reps:10},{weight:72.5,reps:8},{weight:75,reps:5}] },
                { name: "Press Inclinado con Mancuernas", series: [{weight:30,reps:10},{weight:32,reps:8},{weight:32,reps:6}] },
                { name: "Extensión Tríceps en Polea", series: [{weight:26,reps:12},{weight:28,reps:10},{weight:28,reps:9}] }
            ]
        },
        {
            id: "demo_12", date: "2025-12-05", routine: "hombro",
            exercises: [
                { name: "Press Militar con Barra", series: [{weight:42.5,reps:10},{weight:47.5,reps:8},{weight:50,reps:6}] },
                { name: "Elevaciones Laterales", series: [{weight:12,reps:15},{weight:14,reps:12},{weight:14,reps:10}] },
                { name: "Pájaro con Mancuernas", series: [{weight:10,reps:15},{weight:12,reps:12},{weight:12,reps:10}] }
            ]
        },
        {
            id: "demo_13", date: "2025-12-09", routine: "espalda_biceps",
            exercises: [
                { name: "Jalón al Pecho", series: [{weight:62.5,reps:12},{weight:67.5,reps:10},{weight:70,reps:8}] },
                { name: "Remo con Barra", series: [{weight:67.5,reps:10},{weight:72.5,reps:8},{weight:72.5,reps:6}] },
                { name: "Curl Bíceps con Barra", series: [{weight:37.5,reps:12},{weight:40,reps:10},{weight:40,reps:8}] }
            ]
        },
        {
            id: "demo_14", date: "2025-12-12", routine: "pierna",
            exercises: [
                { name: "Sentadilla con Barra", series: [{weight:92.5,reps:10},{weight:100,reps:8},{weight:105,reps:5}] },
                { name: "Prensa de Piernas", series: [{weight:150,reps:12},{weight:160,reps:10},{weight:170,reps:7}] },
                { name: "Femoral Tumbado", series: [{weight:42.5,reps:12},{weight:45,reps:10},{weight:45,reps:8}] }
            ]
        },
        {
            id: "demo_15", date: "2025-12-16", routine: "pecho_triceps",
            exercises: [
                { name: "Press Banca con Barra", series: [{weight:70,reps:10},{weight:75,reps:8},{weight:77.5,reps:5}] },
                { name: "Press Inclinado con Mancuernas", series: [{weight:32,reps:10},{weight:34,reps:8},{weight:34,reps:6}] },
                { name: "Extensión Tríceps en Polea", series: [{weight:28,reps:12},{weight:30,reps:10},{weight:30,reps:9}] }
            ]
        }
    ],
        draftWorkouts: {}
};

// ==================== PANTALLA DE LOGIN ====================
function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
}

// ==================== MODO DEMO ====================

// ==================== COGNITO AUTH ====================

// Calcula HMAC-SHA256 para Cognito SECRET_HASH (solo si tienes client secret)
// Si tu App Client no tiene secret, puedes ignorar esto
async function computeSecretHash(username) {
    // Si no usas client secret, retorna null
    return null;
}

async function loginWithCognito(email, password) {
    const btn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');
    
    btn.disabled = true;
    btn.textContent = '⏳ Iniciando sesión...';
    errorDiv.classList.add('hidden');

    try {
        const body = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: COGNITO_CONFIG.clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        };

        const response = await fetch(
            `https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-amz-json-1.1',
                    'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
                },
                body: JSON.stringify(body)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error de autenticación');
        }

        // Guardar tokens
        cognitoTokens = {
            accessToken: data.AuthenticationResult.AccessToken,
            idToken: data.AuthenticationResult.IdToken,
            refreshToken: data.AuthenticationResult.RefreshToken
        };

        // Extraer info del usuario del ID token
        const payload = JSON.parse(atob(cognitoTokens.idToken.split('.')[1]));
        currentUser = {
            username: payload['cognito:username'] || email,
            email: payload.email || email,
            userId: payload.sub
        };

        // Guardar sesión
        localStorage.setItem('cognitoTokens', JSON.stringify(cognitoTokens));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        appMode = 'real';
        showMainApp();

        // Cargar datos reales desde AWS
        await loadStateFromCloud();
        if (typeof updateQuickStats === "function") updateQuickStats();
        if (typeof updateApiKeyStatus === "function") updateApiKeyStatus();

        console.log('✅ Login exitoso:', currentUser.email);

    } catch (error) {
        errorDiv.textContent = translateCognitoError(error.message);
        errorDiv.classList.remove('hidden');
        console.error('❌ Error login:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = '🔐 Iniciar Sesión';
    }
}

async function registerWithCognito(email, password) {
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');

    // Registro deshabilitado — mostrar mensaje amigable
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    errorDiv.textContent = '⚠️ El registro no está disponible. Si quieres explorar la app, usa el Modo Demo.';
    errorDiv.classList.remove('hidden');
}

async function confirmEmail(email, code) {
    const btn = document.getElementById('confirmBtn');
    const errorDiv = document.getElementById('confirmError');
    const successDiv = document.getElementById('confirmSuccess');

    btn.disabled = true;
    btn.textContent = '⏳ Verificando...';
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');

    try {
        const body = {
            ClientId: COGNITO_CONFIG.clientId,
            Username: email,
            ConfirmationCode: code
        };

        const response = await fetch(
            `https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-amz-json-1.1',
                    'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp'
                },
                body: JSON.stringify(body)
            }
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Código inválido');

        successDiv.textContent = '✅ ¡Email verificado! Ya puedes iniciar sesión.';
        successDiv.classList.remove('hidden');
        setTimeout(() => showTab('login'), 2000);

    } catch (error) {
        errorDiv.textContent = translateCognitoError(error.message);
        errorDiv.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = '✅ Verificar';
    }
}

// ==================== LOGOUT ====================
function logout() {
    cognitoTokens = null;
    currentUser = null;
    appMode = null;
    localStorage.removeItem('cognitoTokens');
    localStorage.removeItem('currentUser');
    routines = {};
    workoutHistory = [];
    draftWorkouts = {};
    document.getElementById('demoBanner').classList.add('hidden');
    // Ocultar pantalla demo si estaba visible
    const ws = document.getElementById('demoWelcomeScreen');
    if (ws) { ws.classList.add('hidden'); ws.style.display = 'none'; }
    // Restaurar loginScreen
    const ls = document.getElementById('loginScreen');
    if (ls) { ls.style.display = ''; }
    showLoginScreen();
    console.log('✅ Sesión cerrada');
}

// ==================== SESIÓN PERSISTENTE ====================
async function checkExistingSession() {
    const savedTokens = localStorage.getItem('cognitoTokens');
    const savedUser = localStorage.getItem('currentUser');

    if (savedTokens && savedUser) {
        try {
            cognitoTokens = JSON.parse(savedTokens);
            currentUser = JSON.parse(savedUser);

            // Verificar que el token no haya expirado (exp en segundos)
            const payload = JSON.parse(atob(cognitoTokens.idToken.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);

            if (payload.exp > now) {
                appMode = 'real';
                showMainApp();
                await loadStateFromCloud();
                if (typeof updateQuickStats === "function") updateQuickStats();
                if (typeof updateApiKeyStatus === "function") updateApiKeyStatus();
                console.log('✅ Sesión restaurada para:', currentUser.email);
                return true;
            }
        } catch (e) {
            console.log('⚠️ Token expirado o inválido');
        }
    }

    localStorage.removeItem('cognitoTokens');
    localStorage.removeItem('currentUser');
    return false;
}

// ==================== HELPERS ====================
function translateCognitoError(message) {
    const errors = {
        'User does not exist.': '❌ No existe una cuenta con ese correo.',
        'Incorrect username or password.': '❌ Correo o contraseña incorrectos.',
        'User is not confirmed.': '⚠️ Debes verificar tu correo antes de iniciar sesión.',
        'An account with the given email already exists.': '⚠️ Ya existe una cuenta con ese correo.',
        'Password did not conform with policy: Password must have uppercase characters': '⚠️ La contraseña debe tener al menos una mayúscula.',
        'Password did not conform with policy: Password must have lowercase characters': '⚠️ La contraseña debe tener al menos una minúscula.',
        'Password did not conform with policy: Password must have numeric characters': '⚠️ La contraseña debe tener al menos un número.',
        'Password did not conform with policy: Password not long enough': '⚠️ La contraseña debe tener al menos 8 caracteres.',
        'Invalid verification code provided, please try again.': '❌ Código de verificación incorrecto.',
        'Attempt limit exceeded, please try after some time.': '⚠️ Demasiados intentos. Espera unos minutos.'
    };
    return errors[message] || `❌ ${message}`;
}

function showTab(tab) {
    ['login', 'register', 'confirm'].forEach(t => {
        document.getElementById(`tab_${t}`).classList.add('hidden');
        document.getElementById(`tabBtn_${t}`)?.classList.remove('active-tab');
    });
    document.getElementById(`tab_${tab}`).classList.remove('hidden');
    document.getElementById(`tabBtn_${tab}`)?.classList.add('active-tab');
}

// ==================== INICIALIZACIÓN ====================
window.addEventListener('load', async () => {
    const hasSession = await checkExistingSession();
    if (!hasSession) {
        showLoginScreen();
    }
});

// ==================== PANTALLA BIENVENIDA DEMO ====================
function enterDemoMode() {
    appMode = 'demo';
    currentUser = { username: 'Demo', email: 'demo@gymtracker.app' };

    // Cargar datos demo
    routines = JSON.parse(JSON.stringify(DEMO_DATA.routines));
    workoutHistory = JSON.parse(JSON.stringify(DEMO_DATA.workoutHistory));
    draftWorkouts = {};

    // Convertir fechas de YYYY-MM-DD a DD/MM/YYYY
    workoutHistory = workoutHistory.map(w => ({
        ...w,
        date: w.date.split('-').reverse().join('/')
    }));

    // Agregar timestamp a cada workout del demo
    workoutHistory = workoutHistory.map((w, i) => ({
        ...w,
        timestamp: new Date(w.date.split('/').reverse().join('-')).getTime() + i
    }));

    // Ocultar login, mostrar pantalla bienvenida
    const loginScreen = document.getElementById('loginScreen');
    const welcomeScreen = document.getElementById('demoWelcomeScreen');
    loginScreen.style.display = 'none';
    welcomeScreen.classList.remove('hidden');
    welcomeScreen.style.display = 'flex';
    console.log('✅ Pantalla bienvenida demo');
}

function startDemoApp() {
    appMode = 'demo'; 
    document.getElementById('demoWelcomeScreen').style.display = 'none';
    document.getElementById('demoWelcomeScreen').classList.add('hidden');
    showMainApp();
    document.getElementById('demoBanner').classList.remove('hidden');
    if (typeof updateQuickStats === 'function') updateQuickStats();
    if (typeof updateApiKeyStatus === 'function') updateApiKeyStatus();
    if (typeof updateUserDisplay === 'function') updateUserDisplay();
    // Mostrar íconos de ayuda
    document.querySelectorAll('.demo-only').forEach(el => el.classList.remove('hidden'));
    // Iniciar tour después de un momento
    setTimeout(() => startTour(), 600);
}

function skipTourAndEnter() {
    document.getElementById('demoWelcomeScreen').style.display = 'none';
    document.getElementById('demoWelcomeScreen').classList.add('hidden');
    showMainApp();
    document.getElementById('demoBanner').classList.remove('hidden');
    if (typeof updateQuickStats === 'function') updateQuickStats();
    if (typeof updateApiKeyStatus === 'function') updateApiKeyStatus();
    if (typeof updateUserDisplay === 'function') updateUserDisplay();
    document.querySelectorAll('.demo-only').forEach(el => el.classList.remove('hidden'));
}
window.skipTourAndEnter = skipTourAndEnter;

// ==================== TOUR GUIADO ====================
const TOUR_STEPS = [
    {
        emoji: '👋',
        title: '¡Bienvenido al Demo!',
        desc: 'Te haré un recorrido rápido por las funciones principales de AI Gym Tracker Pro. Puedes salir en cualquier momento.',
        target: null,
        arrow: 'arrow-none',
        pos: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    },
    {
        emoji: '🏋️',
        title: 'Nuevo Entrenamiento',
        desc: 'Selecciona una rutina y registra cada ejercicio con sus series, pesos y repeticiones. Todo se guarda automáticamente en la nube.',
        target: 'btn_workout',
        arrow: 'arrow-bottom',
    },
    {
        emoji: '📊',
        title: 'Historial Completo',
        desc: 'Consulta todos tus entrenamientos anteriores. Puedes editarlos, eliminarlos o exportar un reporte en PDF.',
        target: 'btn_history',
        arrow: 'arrow-bottom',
    },
    {
        emoji: '📈',
        title: 'Análisis con IA',
        desc: 'La inteligencia artificial analiza tu historial y genera gráficas de progreso, volumen total y detecta desbalances musculares.',
        target: 'btn_analytics',
        arrow: 'arrow-bottom',
    },
    {
        emoji: '🤖',
        title: 'Asistente Chatbot',
        desc: 'El botón 🤖 flotante en la esquina es tu asistente personal. Pregúntale cualquier cosa sobre entrenamiento y te responde con IA.',
        target: 'aiChatButton',
        arrow: 'arrow-right',
    },
    {
        emoji: '🔮',
        title: 'Predicción de Rendimiento',
        desc: 'Usando regresión polinomial y series de tiempo, predice tu 1RM (peso máximo) y progreso en las próximas sesiones.',
        target: 'btn_pred',
        arrow: 'arrow-bottom',
    },
    {
        emoji: '🍎',
        title: 'Contador de Calorías',
        desc: 'Escribe qué comiste o toma una foto con la cámara. La IA calcula calorías, proteínas, carbohidratos y grasas al instante.',
        target: 'btn_cal',
        arrow: 'arrow-bottom',
    },
    {
        emoji: '🎯',
        title: '¡Listo para explorar!',
        desc: 'Eso es todo. Verás íconos ❓ en cada sección para recordarte qué hace cada función. ¡Explora libremente!',
        target: null,
        arrow: 'arrow-none',
        pos: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
];

let tourStep = 0;

function startTour() {
    tourStep = 0;
    document.getElementById('tourOverlay').classList.remove('hidden');
    renderTourStep();
}

function renderTourStep() {
    const step = TOUR_STEPS[tourStep];
    const bubble = document.getElementById('tourBubble');
    const total = TOUR_STEPS.length;

    // Dots
    const dots = Array.from({length: total}, (_, i) =>
        `<div class="tour-dot ${i === tourStep ? 'active' : ''}"></div>`
    ).join('');

    const isLast = tourStep === total - 1;

    bubble.className = `tour-bubble ${step.arrow}`;
    bubble.innerHTML = `
        <div class="tour-emoji">${step.emoji}</div>
        <div class="tour-title">${step.title}</div>
        <div class="tour-desc">${step.desc}</div>
        <div class="tour-progress">${dots}</div>
        <div class="tour-actions">
            <button class="tour-btn-skip" onclick="endTour()">Saltar</button>
            <button class="tour-btn-next" onclick="${isLast ? 'endTour()' : 'nextTourStep()'}">${isLast ? '¡Empezar! 🚀' : 'Siguiente →'}</button>
        </div>
    `;

    // Posicionar burbuja
    if (step.target) {
        const el = document.getElementById(step.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            const bw = 320, bh = 260;
            let top, left;

            const isNearRight =  rect.right > window.innerWidth * 0.7;
            const isNearBottom = rect.bottom > window.innerHeight * 0.7;

            if (isNearRight && isNearBottom) {
                top = rect.top - bh - 20;
                left = rect.left - bw - 20;
            } else if (step.arrow === 'arrow-bottom') {
                top = rect.top - bh - 20;
                left = rect.left + rect.width / 2 - bw / 2;
            } else if (step.arrow === 'arrow-top') {
                top = rect.bottom + 20;
                left = rect.left + rect.width / 2 - bw / 2;
            } else if (step.arrow === 'arrow-right') {
                top = rect.top;
                left = rect.left - bw - 20;
            } else {
                top = rect.bottom + 20;
                left = rect.left;
            }

            // Bounds
            top = Math.max(20, Math.min(top, window.innerHeight - bh - 20));
            left = Math.max(20, Math.min(left, window.innerWidth - bw - 20));

            bubble.style.top = top + 'px';
            bubble.style.left = left + 'px';
            bubble.style.transform = 'none';

            // Highlight
            el.style.position = 'relative';
            el.style.zIndex = '9999';
            el.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.8), 0 0 30px rgba(102,126,234,0.4)';
        }
    } else {
        // Centrado
        bubble.style.top = step.pos?.top || '50%';
        bubble.style.left = step.pos?.left || '50%';
        bubble.style.transform = step.pos?.transform || 'translate(-50%,-50%)';
    }

    bubble.classList.remove('hidden');
}

function nextTourStep() {
    // Quitar highlight del paso anterior
    const prev = TOUR_STEPS[tourStep];
    if (prev.target) {
        const el = document.getElementById(prev.target);
        if (el) { el.style.zIndex = ''; el.style.boxShadow = ''; }
    }
    tourStep++;
    if (tourStep < TOUR_STEPS.length) {
        renderTourStep();
    } else {
        endTour();
    }
}

function endTour() {
    // Limpiar highlights
    TOUR_STEPS.forEach(s => {
        if (s.target) {
            const el = document.getElementById(s.target);
            if (el) { el.style.zIndex = ''; el.style.boxShadow = ''; }
        }
    });
    document.getElementById('tourOverlay').classList.add('hidden');
    document.getElementById('tourBubble').classList.add('hidden');
}

window.startTour = startTour;
window.nextTourStep = nextTourStep;
window.endTour = endTour;
window.startDemoApp = startDemoApp;
window.enterDemoMode = enterDemoMode;
