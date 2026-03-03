// ==================== CONFIGURACIÓN APIS (AWS) ====================
const API_URL = "https://uyqx24lwo0.execute-api.us-east-2.amazonaws.com/workouts";
const STATE_API_URL = "https://oyqfjzp5ze.execute-api.us-east-2.amazonaws.com/state";

// ==================== DATOS Y ESTADO ====================
let routines = {};
let workoutHistory = [];
let draftWorkouts = {}; // Borradores por rutina: {routine: workoutData}
let currentRoutine = '';
let currentWorkoutData = null;
let workoutDate = '';
let addExerciseStep = 'main';
let newExerciseFlow = '';
let selectedExercise = null;
let exerciseName = '';
let newRoutineName = '';
let selectedRoutineForAdd = '';


// ==================== GUARDAR DATOS EN LA NUBE ====================
async function saveData() {
    // 🚫 En modo demo no guardar nada
    if (typeof appMode !== 'undefined' && appMode === 'demo') {
        console.log('🎮 Modo demo: guardado bloqueado');
        return;
    }

    const state = {
        routines: routines,
        workoutHistory: workoutHistory,
        draftWorkouts: draftWorkouts,
        lastModified: new Date().getTime() // ← Timestamp para sincronización
    };

    // 🔥 PRIMERO: Guardar SIEMPRE en localStorage como respaldo
    try {
        localStorage.setItem('gymTrackerState', JSON.stringify(state));
        console.log("✅ Datos guardados en localStorage");
    } catch (error) {
        console.error("❌ Error guardando en localStorage:", error);
    }

    // SEGUNDO: Intentar guardar en la nube (AWS)
    if (STATE_API_URL && !STATE_API_URL.includes("TU_URL")) {
        try {
            const response = await fetch(STATE_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(state)
            });
            
            if (response.ok) {
                console.log("✅ Datos guardados en la nube (AWS)");
            } else {
                console.warn("⚠️ AWS respondió con error:", response.status);
            }
        } catch (error) {
            console.error("❌ Error guardando en la nube:", error);
            console.log("ℹ️ Usando localStorage como respaldo");
        }
    }
}

// ==================== CARGAR DATOS DESDE LA NUBE ====================
async function loadStateFromCloud() {
    // 🚫 En modo demo no cargar desde AWS
    if (typeof appMode !== 'undefined' && appMode === 'demo') {
        console.log('🎮 Modo demo: carga desde AWS bloqueada');
        return false;
    }
    // Solo cargar desde AWS, ignorar localStorage
    if (STATE_API_URL && !STATE_API_URL.includes("TU_URL")) {
        try {
            const response = await fetch(STATE_API_URL);
            if (response.ok) {
                const data = await response.json();
                if (data.routines) routines = data.routines;
                if (data.workoutHistory) workoutHistory = data.workoutHistory;
                if (data.draftWorkouts) draftWorkouts = data.draftWorkouts;
                console.log("✅ Datos cargados desde AWS - Entrenamientos:", workoutHistory.length);
                return true;
            }
        } catch (error) {
            console.error("❌ Error cargando desde AWS:", error);
        }
    }
    
    console.log("⚠️ No se pudo cargar desde AWS");
    return false;
}


console.log('🔍 DEBUG - Entrenamientos cargados:', workoutHistory.length);
console.log('🔍 DEBUG - Rutinas cargadas:', Object.keys(routines).length)

// ==================== INICIALIZACIÓN ====================
// ==================== INICIALIZACIÓN ====================
async function init() {
    // Solo cargar desde AWS si hay una sesión real activa
    if (typeof appMode !== 'undefined' && appMode === 'real') {
        const dataLoaded = await loadStateFromCloud();
        if (!dataLoaded) {
            console.log('⚠️ No hay datos guardados, iniciando vacío');
        }
    }
    
    if (typeof updateUserDisplay === 'function') updateUserDisplay();
    
    console.log('🚀 App iniciada - Rutinas:', Object.keys(routines).length, 'Entrenamientos:', workoutHistory.length);
}

// ==================== NAVEGACIÓN ====================
function showView(viewId) {
    ['mainMenu', 'selectRoutine', 'workout', 'history', 'addExercises', 'management', 'editHistory', 'editWorkout', 'analytics', 'aiRecommendations', 'predictions', 'calories'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');

    if (viewId === 'selectRoutine') {
        renderRoutinesList();
    
    } else if (viewId === 'addExercises') {
        showAddExercises();
    }
    else if (viewId === 'editHistory') {
        showEditHistory();
    }
    else if (viewId === 'history') {
    renderHistoryMenu();
    }
    else if (viewId === 'predictions') {
        populatePredictionExercises();
    }
}

// ==================== AGREGAR EJERCICIOS ====================

function showAddExercises() {
    addExerciseStep = 'main';
    renderAddExercisesView();
    showView('addExercises');
}

function renderAddExercisesView() {
    const container = document.getElementById('addExercises');
    
    if (addExerciseStep === 'main') {
        container.innerHTML = `
            <div>
                <h1 class="text-3xl font-bold text-purple-600 mb-6">Agregar Ejercicios</h1>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
                    <button onclick="setAddExerciseStep('newExercise')" 
                            class="bg-green-500 text-white p-8 rounded-xl text-xl font-semibold hover:shadow-lg transform hover:-translate-y-1 transition">
                        ➕ Agregar Nuevo Ejercicio
                    </button>
                    <button onclick="setAddExerciseStep('selectRoutineForModify')" 
                            class="bg-blue-500 text-white p-8 rounded-xl text-xl font-semibold hover:shadow-lg transform hover:-translate-y-1 transition">
                        ✏️ Modificar Ejercicio Existente
                    </button>
                </div>
                <button onclick="showView('mainMenu')" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                    🏠 Volver al Menú
                </button>
            </div>
        `;
    }
    else if (addExerciseStep === 'newExercise') {
        container.innerHTML = `
            <div>
                <h1 class="text-3xl font-bold text-purple-600 mb-6">¿Dónde agregar el ejercicio?</h1>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
                    <button onclick="handleNewExerciseOption('existing')" 
                            class="bg-purple-600 text-white p-8 rounded-xl text-xl font-semibold hover:shadow-lg transform hover:-translate-y-1 transition">
                        📋 Rutina Existente
                    </button>
                    <button onclick="handleNewExerciseOption('newRoutine')" 
                            class="bg-indigo-600 text-white p-8 rounded-xl text-xl font-semibold hover:shadow-lg transform hover:-translate-y-1 transition">
                        ✨ Crear Nueva Rutina
                    </button>
                </div>
                <button onclick="setAddExerciseStep('main')" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                    ← Volver
                </button>
            </div>
        `;
    }
    else if (addExerciseStep === 'selectRoutineForNew') {
        const routinesOptions = Object.entries(routines).map(([key, routine]) => 
            `<option value="${key}">${routine.name}</option>`
        ).join('');
        
        container.innerHTML = `
            <div>
                <h1 class="text-3xl font-bold text-purple-600 mb-6">Agregar a rutina existente</h1>
                <div class="bg-gray-50 p-6 rounded-lg mb-6">
                    <label class="block text-gray-700 font-semibold mb-3">Nombre del Ejercicio:</label>
                    <input type="text" id="exerciseNameInput" placeholder="Ej: Press de Banca"
                           class="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-purple-600 focus:outline-none">
                    
                    <label class="block text-gray-700 font-semibold mb-3">Rutina:</label>
                    <select id="routineSelectInput" 
                            class="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-purple-600 focus:outline-none">
                        <option value="">-- Selecciona una rutina --</option>
                        ${routinesOptions}
                    </select>
                    
                    <button onclick="addExerciseToRoutine()" 
                            class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600">
                        ✅ Agregar Ejercicio
                    </button>
                </div>
                <button onclick="setAddExerciseStep('newExercise')" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                    ← Volver
                </button>
            </div>
        `;
    }
    else if (addExerciseStep === 'createNewRoutine') {
        container.innerHTML = `
            <div>
                <h1 class="text-3xl font-bold text-purple-600 mb-6">Crear Nueva Rutina</h1>
                <div class="bg-gray-50 p-6 rounded-lg mb-6">
                    <label class="block text-gray-700 font-semibold mb-3">Nombre de la Rutina:</label>
                    <input type="text" id="newRoutineNameInput" placeholder="Ej: CORE, CARDIO, etc."
                           class="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-purple-600 focus:outline-none">
                    
                    <label class="block text-gray-700 font-semibold mb-3">Primer Ejercicio (mínimo 1):</label>
                    <input type="text" id="exerciseNameInput" placeholder="Ej: Plancha"
                           class="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-purple-600 focus:outline-none">
                    
                    <button onclick="createNewRoutineWithExercise()" 
                            class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                        ✨ Crear Rutina
                    </button>
                </div>
                <button onclick="setAddExerciseStep('newExercise')" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                    ← Volver
                </button>
            </div>
        `;
    }
    else if (addExerciseStep === 'selectRoutineForModify') {
        const routinesHTML = Object.entries(routines).map(([key, routine]) => `
            <div class="bg-gray-50 p-6 rounded-lg mb-4">
                <h3 class="text-xl font-bold text-purple-700 mb-3">${routine.name}</h3>
                ${routine.exercises.length === 0 ? 
                    '<p class="text-gray-500">No hay ejercicios en esta rutina</p>' :
                    `<div class="space-y-2">
                        ${routine.exercises.map(ex => `
                            <div onclick="selectExerciseToModify('${key}', ${ex.id})" 
                                 class="bg-white p-4 rounded-lg cursor-pointer hover:bg-purple-50 transition flex justify-between items-center">
                                <span class="font-semibold">${ex.name}</span>
                                <span class="text-purple-600">→</span>
                            </div>
                        `).join('')}
                    </div>`
                }
            </div>
        `).join('');
        
        container.innerHTML = `
            <div>
                <h1 class="text-3xl font-bold text-purple-600 mb-6">Selecciona el ejercicio a modificar</h1>
                ${routinesHTML}
                <button onclick="setAddExerciseStep('main')" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                    ← Volver
                </button>
            </div>
        `;
    }
    else if (addExerciseStep === 'modifyExerciseForm') {
        const routinesOptions = Object.entries(routines).map(([key, routine]) => 
            `<option value="${key}" ${key === selectedRoutineForAdd ? 'selected' : ''}>${routine.name}</option>`
        ).join('');
        
        // Obtener ejercicios de la rutina actual para mostrar el orden
        const currentRoutineExercises = routines[selectedRoutineForAdd].exercises;
        const currentExerciseIndex = currentRoutineExercises.findIndex(ex => ex.id === selectedExercise.id);
        
        container.innerHTML = `
            <div>
                <h1 class="text-3xl font-bold text-purple-600 mb-6">Modificar Ejercicio</h1>
                
                <!-- Modificar Nombre -->
                <div class="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 class="text-lg font-bold text-purple-700 mb-4">📝 Cambiar Nombre</h3>
                    <label class="block text-gray-700 font-semibold mb-3">Nombre del Ejercicio:</label>
                    <input type="text" id="exerciseNameInput" value="${exerciseName}"
                           class="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-purple-600 focus:outline-none">
                    
                    <label class="block text-gray-700 font-semibold mb-3">Mover a Rutina:</label>
                    <select id="routineSelectInput" 
                            class="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:border-purple-600 focus:outline-none">
                        ${routinesOptions}
                    </select>
                    
                    <button onclick="saveModifiedExercise()" 
                            class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
                        💾 Guardar Cambios
                    </button>
                </div>
                
                <!-- Cambiar Orden -->
                <div class="bg-blue-50 p-6 rounded-lg mb-6">
                    <h3 class="text-lg font-bold text-blue-700 mb-4">🔄 Cambiar Orden en ${routines[selectedRoutineForAdd].name}</h3>
                    <div class="space-y-2">
                        ${currentRoutineExercises.map((ex, idx) => `
                            <div class="bg-white p-4 rounded-lg flex justify-between items-center ${ex.id === selectedExercise.id ? 'border-2 border-blue-500' : ''}">
                                <div class="flex items-center gap-3">
                                    <span class="font-bold text-gray-500">#${idx + 1}</span>
                                    <span class="font-semibold ${ex.id === selectedExercise.id ? 'text-blue-600' : ''}">${ex.name}</span>
                                    ${ex.id === selectedExercise.id ? '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">← Este ejercicio</span>' : ''}
                                </div>
                                ${ex.id === selectedExercise.id ? `
                                    <div class="flex gap-2">
                                        ${idx > 0 ? `
                                            <button onclick="moveExerciseUp('${selectedRoutineForAdd}', ${ex.id})" 
                                                    class="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm">
                                                ↑ Subir
                                            </button>
                                        ` : ''}
                                        ${idx < currentRoutineExercises.length - 1 ? `
                                            <button onclick="moveExerciseDown('${selectedRoutineForAdd}', ${ex.id})" 
                                                    class="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm">
                                                ↓ Bajar
                                            </button>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <button onclick="setAddExerciseStep('selectRoutineForModify')" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                    ← Volver
                </button>
            </div>
        `;
    }
}

function setAddExerciseStep(step) {
    addExerciseStep = step;
    renderAddExercisesView();
}

function handleNewExerciseOption(option) {
    newExerciseFlow = option;
    if (option === 'existing') {
        addExerciseStep = 'selectRoutineForNew';
    } else {
        addExerciseStep = 'createNewRoutine';
    }
    renderAddExercisesView();
}

// ==================== SELECCIONAR EJERCICIO PARA MODIFICAR ====================
function selectExerciseToModify(routineKey, exerciseId) {
    const exercise = routines[routineKey].exercises.find(ex => ex.id === exerciseId);
    
    if (!exercise) {
        alert('❌ Ejercicio no encontrado');
        return;
    }
    
    // Guardar información del ejercicio seleccionado
    selectedExercise = {
        id: exercise.id,
        name: exercise.name,
        originalRoutine: routineKey
    };
    
    exerciseName = exercise.name;
    selectedRoutineForAdd = routineKey;
    
    addExerciseStep = 'modifyExerciseForm';
    renderAddExercisesView();
}

// ==================== AGREGAR EJERCICIO A RUTINA EXISTENTE ====================
function addExerciseToRoutine() {
    exerciseName = document.getElementById('exerciseNameInput').value.trim();
    selectedRoutineForAdd = document.getElementById('routineSelectInput').value;
    
    if (!exerciseName) {
        alert('❌ Por favor ingresa el nombre del ejercicio');
        return;
    }
    if (!selectedRoutineForAdd) {
        alert('❌ Por favor selecciona una rutina');
        return;
    }

    const newExercise = {
        id: Date.now(),
        name: exerciseName,
        routine: selectedRoutineForAdd
    };

    routines[selectedRoutineForAdd].exercises.push(newExercise);
    saveData();
    
    // Alerta mejorada con setTimeout para asegurar que se vea
    setTimeout(() => {
        alert(`✅ ¡Ejercicio agregado exitosamente!\n\n📝 Ejercicio: "${exerciseName}"\n📋 Rutina: ${routines[selectedRoutineForAdd].name}`);
        showView('mainMenu');
    }, 100);
}

// ==================== CREAR NUEVA RUTINA CON EJERCICIO ====================
function createNewRoutineWithExercise() {
    newRoutineName = document.getElementById('newRoutineNameInput').value.trim();
    exerciseName = document.getElementById('exerciseNameInput').value.trim();
    
    if (!newRoutineName) {
        alert('❌ Por favor ingresa el nombre de la rutina');
        return;
    }
    if (!exerciseName) {
        alert('❌ Por favor ingresa al menos un ejercicio');
        return;
    }

    const routineKey = newRoutineName.toLowerCase().replace(/\s+/g, '_');
    
    if (routines[routineKey]) {
        alert('⚠️ Ya existe una rutina con ese nombre');
        return;
    }

    const newExercise = {
        id: Date.now(),
        name: exerciseName,
        routine: routineKey
    };

    routines[routineKey] = {
        name: newRoutineName.toUpperCase(),
        exercises: [newExercise]
    };

    saveData();
    
    // Alerta mejorada con setTimeout
    setTimeout(() => {
        alert(`✅ ¡Rutina creada exitosamente!\n\n📋 Rutina: "${newRoutineName.toUpperCase()}"\n📝 Primer ejercicio: "${exerciseName}"`);
        showView('mainMenu');
    }, 100);
}

// ==================== GUARDAR EJERCICIO MODIFICADO ====================
function saveModifiedExercise() {
    const newName = document.getElementById('exerciseNameInput').value.trim();
    const newRoutine = document.getElementById('routineSelectInput').value;
    
    if (!newName) {
        alert('❌ El nombre del ejercicio no puede estar vacío');
        return;
    }

    const originalRoutine = selectedExercise.originalRoutine;
    const originalName = selectedExercise.name;
    
    // Si cambió de rutina, moverlo
    if (newRoutine !== originalRoutine) {
        // Eliminar de rutina original
        routines[originalRoutine].exercises = routines[originalRoutine].exercises.filter(
            ex => ex.id !== selectedExercise.id
        );
        
        // Agregar a nueva rutina
        routines[newRoutine].exercises.push({
            ...selectedExercise,
            name: newName,
            routine: newRoutine
        });
        
        saveData();
        
        setTimeout(() => {
            alert(`✅ ¡Ejercicio movido exitosamente!\n\n📝 "${originalName}" → "${newName}"\n📋 ${routines[originalRoutine].name} → ${routines[newRoutine].name}`);
            showView('mainMenu');
        }, 100);
    } else if (newName !== originalName) {
        // Solo cambiar nombre
        const exercise = routines[originalRoutine].exercises.find(ex => ex.id === selectedExercise.id);
        if (exercise) {
            exercise.name = newName;
        }
        
        saveData();
        
        setTimeout(() => {
            alert(`✅ ¡Ejercicio renombrado!\n\n📝 "${originalName}" → "${newName}"`);
            showView('mainMenu');
        }, 100);
    } else {
        alert('ℹ️ No se realizaron cambios');
    }
}

// ==================== MOVER EJERCICIO HACIA ARRIBA ====================
function moveExerciseUp(routineKey, exerciseId) {
    const exercises = routines[routineKey].exercises;
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    
    if (currentIndex <= 0) {
        alert('⚠️ El ejercicio ya está en la primera posición');
        return;
    }
    
    // Intercambiar con el ejercicio anterior
    [exercises[currentIndex - 1], exercises[currentIndex]] = [exercises[currentIndex], exercises[currentIndex - 1]];
    
    saveData();
    renderAddExercisesView(); // Re-renderizar para mostrar el cambio
    
    console.log('✅ Ejercicio movido hacia arriba');
}

// ==================== MOVER EJERCICIO HACIA ABAJO ====================
function moveExerciseDown(routineKey, exerciseId) {
    const exercises = routines[routineKey].exercises;
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    
    if (currentIndex >= exercises.length - 1) {
        alert('⚠️ El ejercicio ya está en la última posición');
        return;
    }
    
    // Intercambiar con el ejercicio siguiente
    [exercises[currentIndex], exercises[currentIndex + 1]] = [exercises[currentIndex + 1], exercises[currentIndex]];
    
    saveData();
    renderAddExercisesView(); // Re-renderizar para mostrar el cambio
    
    console.log('✅ Ejercicio movido hacia abajo');
}

// ==================== RENDERIZAR LISTA DE RUTINAS ====================
function renderRoutinesList() {
    const container = document.getElementById('routinesList');
    const routinesWithExercises = Object.entries(routines).filter(([k, r]) => r.exercises && r.exercises.length > 0);

    if (routinesWithExercises.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 bg-gray-100 p-8 rounded-lg text-center">
                <p class="text-gray-600 mb-4">No hay rutinas disponibles</p>
            </div>
        `;
        return;
    }

    container.innerHTML = routinesWithExercises.map(([key, routine]) => `
        <div onclick="selectRoutineForWorkout('${key}')" 
             class="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-xl cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition text-center">
            <h3 class="text-2xl font-bold mb-2">${routine.name}</h3>
            <p class="text-sm opacity-90">${routine.exercises.length} ejercicios</p>
        </div>
    `).join('');
}

// ==================== SELECCIONAR RUTINA ====================
function selectRoutineForWorkout(routineKey) {
    const today = new Date();
    workoutDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    currentRoutine = routineKey;
    
    // Verificar si hay un borrador para esta rutina
    const hasDraft = draftWorkouts[routineKey] && draftWorkouts[routineKey].date === workoutDate;
    
    if (hasDraft) {
        // Preguntar si quiere continuar el borrador
        if (confirm(`📝 Tienes un entrenamiento en progreso de ${routines[routineKey].name} de hoy.\n\n¿Deseas continuar donde lo dejaste?`)) {
            // Cargar el borrador
            currentWorkoutData = JSON.parse(JSON.stringify(draftWorkouts[routineKey]));
            renderWorkout();
            showView('workout');
            return;
        }
    }
    
    // Crear nuevo entrenamiento
    currentWorkoutData = {
        routine: routineKey,
        date: workoutDate,
        exercises: routines[routineKey].exercises.map(ex => ({
            id: ex.id,
            name: ex.name,
            sets: [{ reps: '', weight: '', unit: 'kg' }]
        }))
    };

    renderWorkout();
    showView('workout');
}

// ==================== OBTENER ÚLTIMAS 2 SESIONES ====================
function getLastTwoSessions(exerciseName) {
    return workoutHistory
        .filter(w => w.exercises.some(ex => ex.name === exerciseName))
        .map(w => ({
            date: w.date,
            routine: w.routine,
            timestamp: w.timestamp, // ← IMPORTANTE: Incluir timestamp
            sets: w.exercises.find(ex => ex.name === exerciseName).sets.filter(s => s.reps && s.weight)
        }))
        .filter(h => h.sets.length > 0)
        .sort((a, b) => b.timestamp - a.timestamp) // ← ORDENAR POR TIMESTAMP (más reciente primero)
        .slice(0, 2); // ← Tomar las 2 más recientes
}

// ==================== RENDERIZAR ENTRENAMIENTO ====================
function renderWorkout() {
    document.getElementById('workoutTitle').textContent = routines[currentRoutine].name;
    document.getElementById('workoutDate').textContent = `📅 ${workoutDate}`;

    const container = document.getElementById('workoutExercises');
    
    container.innerHTML = currentWorkoutData.exercises.map((exercise, exIndex) => {
        const lastTwo = getLastTwoSessions(exercise.name);
        const maxSets = Math.max(exercise.sets.length, lastTwo[0]?.sets.length || 0, lastTwo[1]?.sets.length || 0);

        let headers = '<th class="p-3 text-left border-r">Serie</th>';

        // PENÚLTIMA sesión (lastTwo[1])
        if (lastTwo.length >= 2) {
            headers += `<th class="p-3 text-center bg-gray-100 border-r" colspan="2">Penúltima<br><span class="text-xs">${lastTwo[1].date}</span></th>`;
        }

        // ÚLTIMA sesión (lastTwo[0])
        if (lastTwo.length >= 1) {
            headers += `<th class="p-3 text-center bg-gray-100 border-r" colspan="2">Última<br><span class="text-xs">${lastTwo[0].date}</span></th>`;
        }

        // Columnas de HOY
        headers += '<th class="p-3 text-center bg-green-100 border-r">Reps</th>';
        headers += '<th class="p-3 text-center bg-green-100">Peso</th>';

        let rows = '';
        for (let setIndex = 0; setIndex < maxSets; setIndex++) {
            rows += `<tr class="border-b">`;
            rows += `<td class="p-3 font-semibold border-r">S${setIndex + 1}</td>`;

            // PENÚLTIMA sesión (lastTwo[1])
            if (lastTwo.length >= 2) {
                const set = lastTwo[1].sets[setIndex];
                if (set && (set.reps || set.weight)) {
                    const unit = set.unit || 'kg';
                    rows += `<td class="p-3 text-center bg-gray-50 border-r">${set.reps || '?'}</td>`;
                    rows += `<td class="p-3 text-center bg-gray-50 border-r">${set.weight || '?'}${unit}</td>`;
                } else {
                    rows += `<td class="p-3 text-center bg-gray-50 border-r text-gray-400">-</td>`;
                    rows += `<td class="p-3 text-center bg-gray-50 border-r text-gray-400">-</td>`;
                }
            }

            // ÚLTIMA sesión (lastTwo[0])
            if (lastTwo.length >= 1) {
                const set = lastTwo[0].sets[setIndex];
                if (set && (set.reps || set.weight)) {
                    const unit = set.unit || 'kg';
                    rows += `<td class="p-3 text-center bg-gray-50 border-r">${set.reps || '?'}</td>`;
                    rows += `<td class="p-3 text-center bg-gray-50 border-r">${set.weight || '?'}${unit}</td>`;
                } else {
                    rows += `<td class="p-3 text-center bg-gray-50 border-r text-gray-400">-</td>`;
                    rows += `<td class="p-3 text-center bg-gray-50 border-r text-gray-400">-</td>`;
                }
            }

            // Columnas de HOY (editable)
            if (exercise.sets[setIndex]) {
                const currentUnit = exercise.sets[setIndex].unit || 'kg';
                rows += `
                    <td class="p-3 text-center bg-green-50 border-r">
                        <input type="number" 
                            value="${exercise.sets[setIndex].reps}" 
                            onchange="updateSet(${exIndex}, ${setIndex}, 'reps', this.value)"
                            placeholder="0"
                            class="w-20 p-2 border-2 rounded text-center focus:border-purple-600 focus:outline-none">
                    </td>
                    <td class="p-3 text-center bg-green-50">
                        <div class="flex items-center justify-center gap-1">
                            <input type="number" 
                                value="${exercise.sets[setIndex].weight}" 
                                onchange="updateSet(${exIndex}, ${setIndex}, 'weight', this.value)"
                                placeholder="0"
                                step="0.5"
                                class="w-16 p-2 border-2 rounded text-center focus:border-purple-600 focus:outline-none">
                            <select onchange="updateSet(${exIndex}, ${setIndex}, 'unit', this.value)"
                                    class="p-2 border-2 rounded text-xs focus:border-purple-600 focus:outline-none">
                                <option value="kg" ${currentUnit === 'kg' ? 'selected' : ''}>kg</option>
                                <option value="lb" ${currentUnit === 'lb' ? 'selected' : ''}>lb</option>
                            </select>
                            <button onclick="removeSet(${exIndex}, ${setIndex})"
                                    class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                                ✖
                            </button>
                        </div>
                    </td>
                `;
            } else {
                rows += '<td class="p-3 text-center bg-green-50 border-r text-gray-400">-</td>';
                rows += '<td class="p-3 text-center bg-green-50 text-gray-400">-</td>';
            }

            rows += '</tr>';
        }

        return `
            <div class="bg-white border-2 border-gray-200 rounded-lg mb-6">
                <div class="bg-purple-600 text-white p-4">
                    <h3 class="text-2xl font-bold">${exercise.name}</h3>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-gray-100">${headers}</tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                
                <div class="p-4 bg-gray-50 border-t">
                    <button onclick="addSet(${exIndex})" 
                            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        ➕ Agregar Serie
                    </button>
                </div>
                
                ${lastTwo.length === 0 ? `
                    <div class="p-4 bg-blue-50 border-t text-center text-gray-600 text-sm">
                        Sin historial previo
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}


// ==================== ACTUALIZAR SET ====================
function updateSet(exIndex, setIndex, field, value) {
    // Convertir a número si es reps o weight
    if (field === 'reps') {
        currentWorkoutData.exercises[exIndex].sets[setIndex][field] = value ? parseInt(value) : '';
    } else if (field === 'weight') {
        currentWorkoutData.exercises[exIndex].sets[setIndex][field] = value ? parseFloat(value) : '';
    } else {
        // Para unit u otros campos, guardar tal cual
        currentWorkoutData.exercises[exIndex].sets[setIndex][field] = value;
    }
}

// ==================== AGREGAR SET ====================
function addSet(exIndex) {
    currentWorkoutData.exercises[exIndex].sets.push({ reps: '', weight: '', unit: 'kg' });
    renderWorkout();
    alert('✅ Serie agregada');
}

// ==================== ELIMINAR SET ====================
function removeSet(exIndex, setIndex) {
    if (currentWorkoutData.exercises[exIndex].sets.length === 1) {
        alert('Debe haber al menos una serie');
        return;
    }
    currentWorkoutData.exercises[exIndex].sets.splice(setIndex, 1);
    renderWorkout();
    alert('✅ Serie eliminada');
}

// ==================== GUARDAR ENTRENAMIENTO ====================
// ==================== GUARDAR BORRADOR ====================
async function saveDraft() {
    // Guardar el estado actual como borrador
    draftWorkouts[currentRoutine] = JSON.parse(JSON.stringify(currentWorkoutData));
    
    await saveData();
    
    alert('💾 Borrador guardado\n\nPuedes cerrar y continuar después.');
}

// ==================== FINALIZAR ENTRENAMIENTO ====================
async function finishWorkout() {
    const routine = currentRoutine;
    const date = workoutDate;
    const exercises = [];

    // Usar los datos que ya están en currentWorkoutData
    currentWorkoutData.exercises.forEach(exercise => {
        const validSets = exercise.sets.filter(set => {
            // Un set es válido si tiene reps Y weight
            const isValid = set.reps && set.weight;
            return isValid;
        });

        if (validSets.length > 0) {
            exercises.push({ 
                id: exercise.id,
                name: exercise.name, 
                sets: validSets.map(set => ({
                    reps: set.reps,
                    weight: set.weight,
                    unit: set.unit || 'kg'
                }))
            });
        }
    });

    if (exercises.length === 0) {
        alert('⚠️ Debes completar al menos una serie de un ejercicio.\n\n' +
              '📝 Para completar una serie debes llenar:\n' +
              '   • Repeticiones (Reps)\n' +
              '   • Peso (kg o lb)\n\n' +
              'Asegúrate de llenar ambos campos en al menos una serie.');
        return;
    }

    // Agregar al historial
    const newWorkout = {
        routine: routine,
        date: date,
        timestamp: new Date().getTime(),
        exercises: exercises
    };

    workoutHistory.push(newWorkout);
    
    // Eliminar el borrador si existe
    if (draftWorkouts[routine]) {
        delete draftWorkouts[routine];
    }
    
    // Guardar en el sistema
    await saveData();

    alert('✅ ¡Entrenamiento finalizado y guardado!');
    showView('mainMenu');
}
// ==================== HISTORIAL MEJORADO ====================

function renderHistoryMenu() {
    const container = document.getElementById('historyContainer');
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
            <button onclick="showHistoryView()" 
                    class="bg-blue-500 text-white p-8 rounded-xl text-xl font-semibold hover:shadow-lg transform hover:-translate-y-1 transition">
                Ver Historial
            </button>
            <button onclick="showEditHistory()" 
                    class="bg-green-500 text-white p-8 rounded-xl text-xl font-semibold hover:shadow-lg transform hover:-translate-y-1 transition">
                ✏️ Editar Historial
            </button>
        </div>
    `;
}

function showHistoryView() {
    const container = document.getElementById('historyContainer');

    if (workoutHistory.length === 0) {
        container.innerHTML = `
            <div class="bg-gray-100 p-8 rounded-lg text-center mb-6">
                <p class="text-gray-600">Sin entrenamientos registrados</p>
            </div>
            <button onclick="renderHistoryMenu()" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                ← Volver
            </button>
        `;
        return;
    }

    // Agrupar workouts por rutina
    const workoutsByRoutine = {};
    workoutHistory.forEach(workout => {
        if (!workoutsByRoutine[workout.routine]) {
            workoutsByRoutine[workout.routine] = [];
        }
        workoutsByRoutine[workout.routine].push(workout);
    });

    // Ordenar cada rutina por fecha
    Object.keys(workoutsByRoutine).forEach(routineKey => {
        workoutsByRoutine[routineKey].sort((a, b) => {
            const parseDate = (d) => {
                const [day, month, year] = d.split('/');
                return new Date(year, month - 1, day);
            };
            return parseDate(a.date) - parseDate(b.date);
        });
    });

    // Crear selector de rutinas
    const routineOptions = Object.keys(workoutsByRoutine).map(key => {
        const routineName = routines[key]?.name || key.toUpperCase();
        return `<option value="${key}">${routineName}</option>`;
    }).join('');

    container.innerHTML = `
        <div class="mb-6">
            <label class="block text-lg font-semibold text-purple-700 mb-3">Selecciona una rutina:</label>
            <select id="routineHistorySelect" onchange="renderRoutineHistory()" 
                    class="w-full max-w-md p-3 border-2 border-purple-300 rounded-lg focus:border-purple-600 focus:outline-none bg-white/10 text-white"
                <option value="">-- Selecciona --</option>
                ${routineOptions}
            </select>
        </div>
        <div id="routineHistoryTable"></div>
        <button onclick="renderHistoryMenu()" class="mt-6 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
            ← Volver
        </button>
    `;
}

function renderRoutineHistory() {
    const selectedRoutine = document.getElementById('routineHistorySelect').value;
    const container = document.getElementById('routineHistoryTable');
    
    if (!selectedRoutine) {
        container.innerHTML = '';
        return;
    }

    const workouts = workoutHistory
        .filter(w => w.routine === selectedRoutine)
        .sort((a, b) => {
            const parseDate = (d) => {
                const [day, month, year] = d.split('/');
                return new Date(year, month - 1, day);
            };
            return parseDate(a.date) - parseDate(b.date);
        });

    if (workouts.length === 0) {
        container.innerHTML = '<p class="text-gray-600">No hay entrenamientos para esta rutina</p>';
        return;
    }

    // Obtener todos los ejercicios únicos de esta rutina
    const allExercises = new Set();
    workouts.forEach(w => {
        w.exercises.forEach(ex => allExercises.add(ex.name));
    });

    // Crear encabezados de fechas
    const dateHeaders = workouts.map(w => 
        `<th class="p-3 text-center bg-purple-100 border-r border-b font-semibold min-w-[200px]">${w.date}</th>`
    ).join('');

    // Crear filas de ejercicios
    const exerciseRows = Array.from(allExercises).map(exerciseName => {
        const cells = workouts.map(workout => {
            const exercise = workout.exercises.find(ex => ex.name === exerciseName);
            
            if (!exercise || !exercise.sets || exercise.sets.length === 0) {
                return '<td class="p-3 text-center border-r border-b text-gray-400">-</td>';
            }

            const setsText = exercise.sets
                .filter(s => s.reps || s.weight)
                .map(s => {
                    const unit = s.unit || 'kg';
                    return `${s.weight || '?'}${unit} / ${s.reps || '?'} reps`;
                })
                .join('<br>');

            return `<td class="p-3 text-center border-r border-b text-sm">${setsText || '-'}</td>`;
        }).join('');

        return `
            <tr>
                <td class="p-3 font-semibold bg-purple-50 border-r border-b sticky left-0 z-10">${exerciseName}</td>
                ${cells}
            </tr>
        `;
    }).join('');

    const routineName = routines[selectedRoutine]?.name || selectedRoutine.toUpperCase();

    container.innerHTML = `
        <div class="mb-4">
            <h2 class="text-2xl font-bold text-purple-700">${routineName} - Historial Completo</h2>
        </div>
        <div class="overflow-x-auto border-2 border-purple-300 rounded-lg">
            <table class="w-full border-collapse bg-white">
                <thead>
                    <tr class="bg-purple-600 text-white">
                        <th class="p-3 text-left border-r border-b sticky left-0 z-20 bg-purple-600 min-w-[150px]">Ejercicio</th>
                        ${dateHeaders}
                    </tr>
                </thead>
                <tbody>
                    ${exerciseRows}
                </tbody>
            </table>
        </div>
    `;
}

// ==================== GESTIONAR RUTINAS (SOLO BORRAR) ====================

function showManagement() {
    renderManagementMenu();
    showView('management');
}

function renderManagementMenu() {
    const container = document.getElementById('management');
    
    container.innerHTML = `
        <div>
            <h1 class="text-3xl font-bold text-purple-600 mb-6">⚙️ Gestionar Rutinas</h1>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
                <button onclick="showDeleteRoutine()" 
                        class="bg-red-500 text-white p-8 rounded-xl text-xl font-semibold hover:shadow-lg transform hover:-translate-y-1 transition">
                    🗑️ Eliminar Rutina Completa
                </button>
                <button onclick="showDeleteExercise()" 
                        class="bg-orange-500 text-white p-8 rounded-xl text-xl font-semibold hover:shadow-lg transform hover:-translate-y-1 transition">
                    ✂️ Eliminar Ejercicio
                </button>
            </div>
            <button onclick="showView('mainMenu')" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                🏠 Volver al Menú
            </button>
        </div>
    `;
}

function showDeleteRoutine() {
    const container = document.getElementById('management');
    
    if (Object.keys(routines).length === 0) {
        container.innerHTML = `
            <div>
                <h1 class="text-3xl font-bold text-purple-600 mb-6">🗑️ Eliminar Rutina</h1>
                <div class="bg-gray-100 p-8 rounded-lg text-center">
                    <p class="text-gray-600">No hay rutinas para eliminar</p>
                </div>
                <button onclick="showManagement()" class="mt-6 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                    ← Volver
                </button>
            </div>
        `;
        return;
    }

    const routinesHTML = Object.entries(routines).map(([key, routine]) => `
        <div class="bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-2xl font-bold text-purple-700">${routine.name}</h3>
                    <p class="text-gray-600 text-sm">${routine.exercises.length} ejercicios</p>
                </div>
                <button onclick="confirmDeleteRoutine('${key}')" 
                        class="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-semibold">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div>
            <h1 class="text-3xl font-bold text-purple-600 mb-6">🗑️ Eliminar Rutina Completa</h1>
            <div class="space-y-4 mb-6">
                ${routinesHTML}
            </div>
            <button onclick="showManagement()" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                ← Volver
            </button>
        </div>
    `;
}

function confirmDeleteRoutine(routineKey) {
    if (!confirm(`¿Eliminar la rutina ${routines[routineKey].name} completamente? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    delete routines[routineKey];
    saveData();
    alert('Rutina eliminada correctamente');
    
    if (Object.keys(routines).length === 0) {
        showView('mainMenu');
    } else {
        showDeleteRoutine();
    }
}

function showDeleteExercise() {
    const container = document.getElementById('management');
    
    if (Object.keys(routines).length === 0) {
        container.innerHTML = `
            <div>
                <h1 class="text-3xl font-bold text-purple-600 mb-6">✂️ Eliminar Ejercicio</h1>
                <div class="bg-gray-100 p-8 rounded-lg text-center">
                    <p class="text-gray-600">No hay rutinas disponibles</p>
                </div>
                <button onclick="showManagement()" class="mt-6 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                    ← Volver
                </button>
            </div>
        `;
        return;
    }

    const routinesHTML = Object.entries(routines).map(([key, routine]) => `
        <div class="bg-gray-50 p-6 rounded-lg mb-4">
            <h3 class="text-xl font-bold text-purple-700 mb-3">${routine.name}</h3>
            ${routine.exercises.length === 0 ? 
                '<p class="text-gray-500">No hay ejercicios en esta rutina</p>' :
                `<div class="space-y-2">
                    ${routine.exercises.map(ex => `
                        <div class="bg-white p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 transition">
                            <span class="font-semibold text-gray-700">${ex.name}</span>
                            <button onclick="confirmDeleteExercise('${key}', ${ex.id})" 
                                    class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm">
                                🗑️ Eliminar
                            </button>
                        </div>
                    `).join('')}
                </div>`
            }
        </div>
    `).join('');

    container.innerHTML = `
        <div>
            <h1 class="text-3xl font-bold text-purple-600 mb-6">✂️ Eliminar Ejercicio de Rutina</h1>
            <div class="space-y-4 mb-6">
                ${routinesHTML}
            </div>
            <button onclick="showManagement()" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                ← Volver
            </button>
        </div>
    `;
}

function confirmDeleteExercise(routineKey, exerciseId) {
    const exercise = routines[routineKey].exercises.find(ex => ex.id === exerciseId);
    
    if (!confirm(`¿Eliminar "${exercise.name}" de ${routines[routineKey].name}?`)) {
        return;
    }
    
    routines[routineKey].exercises = routines[routineKey].exercises.filter(
        ex => ex.id !== exerciseId
    );
    
    saveData();
    alert('Ejercicio eliminado correctamente');
    showDeleteExercise();
}

// ==================== EDITAR HISTORIAL ====================

function showEditHistory() {
    renderEditHistoryList();
    showView('editHistory');
}

function renderEditHistoryList() {
    const container = document.getElementById('editHistory');
    
    if (workoutHistory.length === 0) {
        container.innerHTML = `
            <div>
                <h1 class="text-3xl font-bold text-purple-600 mb-6">✏️ Editar Historial</h1>
                <div class="bg-gray-100 p-8 rounded-lg text-center">
                    <p class="text-gray-600">No hay entrenamientos registrados</p>
                </div>
                <button onclick="showView('mainMenu')" class="mt-6 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                    🏠 Volver
                </button>
            </div>
        `;
        return;
    }

    const sorted = [...workoutHistory].sort((a, b) => b.timestamp - a.timestamp);
    
    const workoutsHTML = sorted.map((workout, sortedIndex) => {
        // Encontrar el índice real en workoutHistory
        const realIndex = workoutHistory.findIndex(w => w.timestamp === workout.timestamp && w.routine === workout.routine);
        
        return `
            <div class="bg-white border-2 border-gray-200 rounded-lg p-6 mb-4 hover:shadow-md transition">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-2xl font-bold text-purple-700">
                            ${routines[workout.routine]?.name || workout.routine}
                        </h3>
                        <p class="text-gray-600">📅 ${workout.date}</p>
                        <p class="text-gray-500 text-sm">${workout.exercises.length} ejercicios</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editWorkoutHistory(${sortedIndex})" 
                                class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold">
                            ✏️ Editar
                        </button>
                        <button onclick="deleteWorkout(${realIndex})" 
                                class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div>
            <h1 class="text-3xl font-bold text-purple-600 mb-6">✏️ Editar Historial de Entrenamientos</h1>
            <div class="mb-6">
                ${workoutsHTML}
            </div>
            <button onclick="showView('mainMenu')" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                🏠 Volver
            </button>
        </div>
    `;
}

function editWorkoutHistory(workoutIndex) {
    const sorted = [...workoutHistory].sort((a, b) => b.timestamp - a.timestamp);
    const workout = sorted[workoutIndex];
    
    const realIndex = workoutHistory.findIndex(w => w.timestamp === workout.timestamp);
    
    currentWorkoutData = JSON.parse(JSON.stringify(workout));
    currentRoutine = workout.routine;
    workoutDate = workout.date;
    currentWorkoutData.editingIndex = realIndex;
    
    renderEditWorkoutForm();
    showView('editWorkout');
}

function renderEditWorkoutForm() {
    const container = document.getElementById('editWorkout');
    
    const exercisesHTML = currentWorkoutData.exercises.map((exercise, exIndex) => {
        const setsHTML = exercise.sets.map((set, setIndex) => `
            <tr class="border-b">
                <td class="p-3 font-semibold">S${setIndex + 1}</td>
                <td class="p-3 text-center">
                    <input type="number" 
                           value="${set.reps}" 
                           onchange="updateEditSet(${exIndex}, ${setIndex}, 'reps', this.value)"
                           placeholder="0"
                           class="w-20 p-2 border-2 rounded text-center focus:border-purple-600 focus:outline-none">
                </td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <input type="number" 
                               value="${set.weight}" 
                               onchange="updateEditSet(${exIndex}, ${setIndex}, 'weight', this.value)"
                               placeholder="0"
                               step="0.5"
                               class="w-20 p-2 border-2 rounded text-center focus:border-purple-600 focus:outline-none">
                        ${exercise.sets.length > 1 ? `
                            <button onclick="removeEditSet(${exIndex}, ${setIndex})"
                                    class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                                ✖
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        return `
            <div class="bg-white border-2 border-gray-200 rounded-lg mb-6">
                <div class="bg-purple-600 text-white p-4">
                    <h3 class="text-2xl font-bold">${exercise.name}</h3>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="p-3 text-left">Serie</th>
                                <th class="p-3 text-center">Reps</th>
                                <th class="p-3 text-center">Peso (kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${setsHTML}
                        </tbody>
                    </table>
                </div>
                
                <div class="p-4 bg-gray-50 border-t">
                    <button onclick="addEditSet(${exIndex})" 
                            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        ➕ Agregar Serie
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div>
            <div class="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-xl mb-6">
                <h2 class="text-3xl font-bold">Editando: ${routines[currentRoutine]?.name || currentRoutine}</h2>
                <p class="text-lg">📅 ${workoutDate}</p>
            </div>

            ${exercisesHTML}

            <div class="flex gap-4 flex-wrap mt-6">
                <button onclick="saveEditedWorkout()" 
                        class="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 font-bold text-lg">
                    💾 Guardar Cambios
                </button>
                <button onclick="showEditHistory()" 
                        class="bg-gray-500 text-white px-8 py-4 rounded-lg hover:bg-gray-600 font-bold text-lg">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `;
}

function updateEditSet(exIndex, setIndex, field, value) {
    currentWorkoutData.exercises[exIndex].sets[setIndex][field] = value;
}

function addEditSet(exIndex) {
    currentWorkoutData.exercises[exIndex].sets.push({ reps: '', weight: '', unit: 'kg' });
    renderEditWorkoutForm();
    alert('✅ Serie agregada');
}

function removeEditSet(exIndex, setIndex) {
    if (currentWorkoutData.exercises[exIndex].sets.length === 1) {
        alert('Debe haber al menos una serie');
        return;
    }
    currentWorkoutData.exercises[exIndex].sets.splice(setIndex, 1);
    renderEditWorkoutForm();
    alert('✅ Serie eliminada');
}

function saveEditedWorkout() {
    const editIndex = currentWorkoutData.editingIndex;
    delete currentWorkoutData.editingIndex;
    
    workoutHistory[editIndex] = currentWorkoutData;
    saveData();
    
    alert('✅ Entrenamiento actualizado');
    showEditHistory();
}

function clearAllHistory() {
    if (confirm('⚠️ ¿Estás seguro de que quieres borrar TODO el historial? Esta acción no se puede deshacer.')) {
        workoutHistory = [];
        saveData();
        renderHistoryMenu();
        alert('✅ Historial eliminado completamente');
    }
}

function downloadHistoryPDF() {
    // Usar el array workoutHistory en lugar de localStorage
    const workouts = workoutHistory;
    
    if (!workouts || workouts.length === 0) {
        alert('⚠️ No hay entrenamientos en el historial para descargar');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // Título principal
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Historial de Entrenamientos - Gym Tracker', margin, yPosition);
    yPosition += 15;
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, margin, yPosition);
    yPosition += 10;
    
    // Recorrer cada entrenamiento
    workouts.forEach((workout, index) => {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Separador
        doc.setDrawColor(128, 0, 128);
        doc.line(margin, yPosition, 190, yPosition);
        yPosition += 8;
        
        // Título del entrenamiento
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(128, 0, 128);
        doc.text(`${workout.routine}`, margin, yPosition);
        yPosition += 7;
        
        // Fecha
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(workout.date, margin, yPosition);
        yPosition += 8;
        
        // Ejercicios
        doc.setTextColor(0, 0, 0);
        if (workout.exercises && workout.exercises.length > 0) {
            workout.exercises.forEach(exercise => {
                if (yPosition > pageHeight - 30) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.setFont(undefined, 'bold');
                doc.text(`• ${exercise.name}`, margin + 5, yPosition);
                yPosition += 6;
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                
                if (exercise.sets && exercise.sets.length > 0) {
                    exercise.sets.forEach((set, setIndex) => {
                        if (yPosition > pageHeight - 20) {
                            doc.addPage();
                            yPosition = 20;
                        }
                        
                        const setInfo = `   Serie ${setIndex + 1}: ${set.reps} reps @ ${set.weight} kg`;
                        doc.text(setInfo, margin + 10, yPosition);
                        yPosition += 5;
                    });
                }
                
                doc.setFontSize(10);
                yPosition += 3;
            });
        }
        
        yPosition += 5;
    });
    
    // Guardar el PDF
    const fileName = `historial_gym_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    alert('✅ PDF descargado correctamente');
}

function deleteWorkout(index) {
    const workout = workoutHistory[index];
    const routineName = routines[workout.routine]?.name || workout.routine;
    
    if (confirm(`¿Eliminar entrenamiento de ${routineName} del ${workout.date}?\n\nEsta acción no se puede deshacer.`)) {
        workoutHistory.splice(index, 1);
        saveData();
        renderEditHistoryList();
        alert('✅ Entrenamiento eliminado');
    }
}

// ==================== PREDICCIONES ====================
const PREDICTION_API_URL = "https://oyqfjzp5ze.execute-api.us-east-2.amazonaws.com/prediction";

function populatePredictionExercises() {
    const select = document.getElementById('predictionExerciseSelect');
    if (!select) return;

    // Recopilar todos los ejercicios únicos del historial
    const exercises = new Set();
    workoutHistory.forEach(workout => {
        (workout.exercises || []).forEach(ex => {
            if (ex.name) exercises.add(ex.name);
        });
    });

    select.innerHTML = '<option value="">-- Elige un ejercicio --</option>';
    [...exercises].sort().forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
}

async function runPrediction() {
    const exerciseName = document.getElementById('predictionExerciseSelect').value;
    const sessionsAhead = parseInt(document.getElementById('predictionSessionsAhead').value);
    const resultDiv = document.getElementById('predictionResult');

    if (!exerciseName) {
        resultDiv.innerHTML = `<div class="glass-card p-4 text-yellow-300">⚠️ Selecciona un ejercicio primero.</div>`;
        return;
    }

    // Mostrar loading
    resultDiv.innerHTML = `
        <div class="glass-card p-8 text-center text-white">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-lg">Calculando predicción para <strong>${exerciseName}</strong>...</p>
        </div>
    `;

    try {
        const response = await fetch(PREDICTION_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workoutHistory: workoutHistory,
                exerciseName: exerciseName,
                sessionsAhead: sessionsAhead
            })
        });

        const data = await response.json();

        if (data.error) {
            resultDiv.innerHTML = `
                <div class="glass-card p-6 text-yellow-300">
                    <p class="text-lg font-semibold">⚠️ ${data.error}</p>
                    ${data.sessions_found !== undefined ? `<p class="text-sm mt-2 text-white/60">Sesiones encontradas: ${data.sessions_found}. Necesitas al menos 2.</p>` : ''}
                </div>
            `;
            return;
        }

        // Renderizar resultado
        const trendEmoji = data.trend === 'mejorando' ? '📈' : data.trend === 'desacelerando' ? '📉' : '➡️';
        const trendColor = data.trend === 'mejorando' ? 'text-green-400' : data.trend === 'desacelerando' ? 'text-yellow-400' : 'text-gray-400';

        const predictionsHTML = data.predictions.map(p => `
            <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                <span class="text-white/70">${p.label}</span>
                <span class="text-white font-bold text-lg">${p.predicted_1rm} kg <span class="text-white/50 text-sm font-normal">1RM est.</span></span>
            </div>
        `).join('');

        const historicalHTML = data.historical_data.slice(-5).map(h => `
            <div class="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span class="text-white/60 text-sm">Sesión ${h.session} · ${h.date}</span>
                <span class="text-white font-semibold">${h.estimated_1rm} kg</span>
            </div>
        `).join('');

        resultDiv.innerHTML = `
            <!-- Stats principales -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div class="glass-card p-4 text-center">
                    <p class="text-white/60 text-sm mb-1">1RM Actual</p>
                    <p class="text-3xl font-bold text-white">${data.current_1rm} kg</p>
                </div>
                <div class="glass-card p-4 text-center">
                    <p class="text-white/60 text-sm mb-1">1RM Máximo</p>
                    <p class="text-3xl font-bold text-purple-400">${data.peak_1rm} kg</p>
                </div>
                <div class="glass-card p-4 text-center col-span-2 md:col-span-1">
                    <p class="text-white/60 text-sm mb-1">Tendencia</p>
                    <p class="text-2xl font-bold ${trendColor}">${trendEmoji} ${data.trend}</p>
                </div>
            </div>

            ${data.plateau_detected ? `
            <div class="glass-card p-4 border border-yellow-400/30 bg-yellow-400/10">
                <p class="text-yellow-300 font-semibold">⚠️ Posible estancamiento detectado</p>
                <p class="text-yellow-200/70 text-sm mt-1">Tu progreso en las últimas sesiones ha variado menos de 2kg. Considera cambiar el estímulo: más volumen, técnica diferente o deload.</p>
            </div>` : ''}

            <!-- Predicciones -->
            <div class="glass-card p-6">
                <h3 class="text-white font-bold text-lg mb-4">Predicciones próximas ${sessionsAhead} sesiones</h3>
                <div class="space-y-2">${predictionsHTML}</div>
                <p class="text-white/40 text-xs mt-4">* 1RM estimado con fórmula de Epley (peso × (1 + reps/30)). Basado en ${data.sessions_analyzed} sesiones analizadas.</p>
            </div>

            <!-- Historial reciente -->
            <div class="glass-card p-6">
                <h3 class="text-white font-bold text-lg mb-4">Últimas sesiones de ${exerciseName}</h3>
                <div class="space-y-2">${historicalHTML}</div>
            </div>
        `;

    } catch (error) {
        resultDiv.innerHTML = `
            <div class="glass-card p-6 text-red-400">
                <p class="font-semibold">❌ Error al conectar con el servidor</p>
                <p class="text-sm mt-2 text-white/60">${error.message}</p>
            </div>
        `;
    }
}

// ==================== CONTADOR DE CALORÍAS ====================
function quickSearch(food) {
    document.getElementById('foodInput').value = food;
    searchFood();
}

async function searchFood() {
    const input = document.getElementById('foodInput').value.trim();
    const resultDiv = document.getElementById('caloriesResult');

    if (!input) {
        resultDiv.innerHTML = `<div class="glass-card p-4 text-yellow-300">⚠️ Escribe un alimento primero.</div>`;
        return;
    }

    resultDiv.innerHTML = `
        <div class="glass-card p-8 text-center text-white">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-lg">Buscando información de <strong>${input}</strong>...</p>
        </div>
    `;

    try {
        // Usar Gemini para normalizar el alimento al inglés para mejor búsqueda
        let searchTerm = input;
        if (window.callOpenAI) {
            const normalized = await window.callOpenAI(
                `Traduce este alimento al inglés para buscar en una base de datos nutricional. Responde SOLO con el nombre en inglés, sin explicaciones: "${input}"`
            );
            if (normalized) searchTerm = normalized.trim();
        }

        // Buscar en Open Food Facts
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,nutriments,serving_size,image_small_url`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.products || data.products.length === 0) {
            // Fallback: usar Gemini para dar info nutricional aproximada
            await searchFoodWithGemini(input, resultDiv);
            return;
        }

        // Filtrar productos con datos nutricionales
        const validProducts = data.products.filter(p => 
            p.nutriments && p.nutriments['energy-kcal_100g']
        );

        if (validProducts.length === 0) {
            await searchFoodWithGemini(input, resultDiv);
            return;
        }

        // Mostrar resultados
        const productsHTML = validProducts.slice(0, 3).map((product, i) => {
            const n = product.nutriments;
            const kcal = Math.round(n['energy-kcal_100g'] || 0);
            const protein = (n['proteins_100g'] || 0).toFixed(1);
            const carbs = (n['carbohydrates_100g'] || 0).toFixed(1);
            const fat = (n['fat_100g'] || 0).toFixed(1);
            const fiber = (n['fiber_100g'] || 0).toFixed(1);
            const name = product.product_name || searchTerm;

            return `
                <div class="glass-card p-6">
                    <h3 class="text-white font-bold text-lg mb-4">${i === 0 ? '⭐ ' : ''}${name} <span class="text-white/50 text-sm font-normal">por 100g</span></h3>
                    
                    <!-- Calorías destacadas -->
                    <div class="text-center bg-white/10 rounded-xl p-4 mb-4">
                        <p class="text-white/60 text-sm">Calorías</p>
                        <p class="text-5xl font-bold text-white">${kcal}</p>
                        <p class="text-white/60 text-sm">kcal</p>
                    </div>

                    <!-- Macros -->
                    <div class="grid grid-cols-3 gap-3">
                        <div class="text-center bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                            <p class="text-blue-300 text-xs mb-1">Proteína</p>
                            <p class="text-white font-bold text-xl">${protein}g</p>
                        </div>
                        <div class="text-center bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30">
                            <p class="text-yellow-300 text-xs mb-1">Carbos</p>
                            <p class="text-white font-bold text-xl">${carbs}g</p>
                        </div>
                        <div class="text-center bg-red-500/20 rounded-lg p-3 border border-red-400/30">
                            <p class="text-red-300 text-xs mb-1">Grasas</p>
                            <p class="text-white font-bold text-xl">${fat}g</p>
                        </div>
                    </div>
                    ${fiber > 0 ? `<p class="text-white/50 text-sm mt-3 text-center">Fibra: ${fiber}g</p>` : ''}
                </div>
            `;
        }).join('');

        resultDiv.innerHTML = `
            <p class="text-white/60 text-sm mb-3">Mostrando resultados para: <strong class="text-white">${input}</strong></p>
            ${productsHTML}
            <p class="text-white/30 text-xs text-center mt-4">Fuente: Open Food Facts · Valores por 100g</p>
        `;

    } catch (error) {
        await searchFoodWithGemini(input, resultDiv);
    }
}

async function searchFoodWithGemini(input, resultDiv) {
    if (!window.callOpenAI) {
        resultDiv.innerHTML = `<div class="glass-card p-6 text-red-400">❌ No se encontró información para "${input}".</div>`;
        return;
    }

    try {
        const prompt = `Eres un nutricionista experto. Dame la información nutricional aproximada de: "${input}"
        
Responde SOLO con este formato JSON exacto, sin texto adicional:
{
  "nombre": "nombre del alimento",
  "porcion": "100g (o la porción más común)",
  "calorias": número,
  "proteina": número en gramos,
  "carbohidratos": número en gramos,
  "grasas": número en gramos,
  "fibra": número en gramos,
  "consejo": "un consejo nutricional corto relacionado con el fitness"
}`;

        const response = await window.callOpenAI(prompt);
        if (!response) throw new Error('Sin respuesta');

        const clean = response.replace(/```json|```/g, '').trim();
        const data = JSON.parse(clean);

        resultDiv.innerHTML = `
            <p class="text-white/60 text-sm mb-3">Resultado para: <strong class="text-white">${input}</strong> <span class="text-purple-400 text-xs">(estimado por IA)</span></p>
            <div class="glass-card p-6">
                <h3 class="text-white font-bold text-lg mb-4">🤖 ${data.nombre} <span class="text-white/50 text-sm font-normal">por ${data.porcion}</span></h3>
                
                <div class="text-center bg-white/10 rounded-xl p-4 mb-4">
                    <p class="text-white/60 text-sm">Calorías</p>
                    <p class="text-5xl font-bold text-white">${data.calorias}</p>
                    <p class="text-white/60 text-sm">kcal</p>
                </div>

                <div class="grid grid-cols-3 gap-3 mb-4">
                    <div class="text-center bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                        <p class="text-blue-300 text-xs mb-1">Proteína</p>
                        <p class="text-white font-bold text-xl">${data.proteina}g</p>
                    </div>
                    <div class="text-center bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30">
                        <p class="text-yellow-300 text-xs mb-1">Carbos</p>
                        <p class="text-white font-bold text-xl">${data.carbohidratos}g</p>
                    </div>
                    <div class="text-center bg-red-500/20 rounded-lg p-3 border border-red-400/30">
                        <p class="text-red-300 text-xs mb-1">Grasas</p>
                        <p class="text-white font-bold text-xl">${data.grasas}g</p>
                    </div>
                </div>

                ${data.fibra > 0 ? `<p class="text-white/50 text-sm text-center mb-4">Fibra: ${data.fibra}g</p>` : ''}

                <div class="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3">
                    <p class="text-purple-300 text-sm">💡 ${data.consejo}</p>
                </div>
            </div>
            <p class="text-white/30 text-xs text-center mt-4">* Valores estimados por IA · Pueden variar según preparación</p>
        `;
    } catch (e) {
        resultDiv.innerHTML = `<div class="glass-card p-6 text-red-400">❌ No se pudo obtener información de "${input}". Intenta con otro nombre.</div>`;
    }
}

// ==================== CONTADOR DE CALORÍAS - CÁMARA ====================
let cameraStream = null;
let capturedImageBase64 = null;

function setCaloriesMode(mode) {
    const modeText = document.getElementById('modeText');
    const modeCamera = document.getElementById('modeCamera');
    const tabText = document.getElementById('tabText');
    const tabCamera = document.getElementById('tabCamera');

    if (mode === 'text') {
        modeText.classList.remove('hidden');
        modeCamera.classList.add('hidden');
        tabText.className = 'btn-primary flex-1';
        tabCamera.className = 'flex-1 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/20 font-semibold';
        stopCamera();
    } else {
        modeText.classList.add('hidden');
        modeCamera.classList.remove('hidden');
        tabText.className = 'flex-1 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/20 font-semibold';
        tabCamera.className = 'btn-primary flex-1';
    }
    document.getElementById('caloriesResult').innerHTML = '';
}

async function startCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        const video = document.getElementById('cameraStream');
        video.srcObject = cameraStream;
        video.classList.remove('hidden');
        document.getElementById('cameraPlaceholder').classList.add('hidden');
        document.getElementById('capturedPhoto').classList.add('hidden');
        document.getElementById('btnStartCamera').classList.add('hidden');
        document.getElementById('btnCapture').classList.remove('hidden');
        document.getElementById('btnRetake').classList.add('hidden');
        document.getElementById('btnAnalyze').classList.add('hidden');
        capturedImageBase64 = null;
    } catch (error) {
        document.getElementById('caloriesResult').innerHTML = `
            <div class="glass-card p-4 text-yellow-300">
                ⚠️ No se pudo acceder a la cámara. Intenta subir una imagen directamente.
            </div>
        `;
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraStream');
    const canvas = document.getElementById('cameraCanvas');
    const photo = document.getElementById('capturedPhoto');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    capturedImageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    photo.src = canvas.toDataURL('image/jpeg', 0.8);

    video.classList.add('hidden');
    photo.classList.remove('hidden');

    stopCamera();

    document.getElementById('btnCapture').classList.add('hidden');
    document.getElementById('btnRetake').classList.remove('hidden');
    document.getElementById('btnAnalyze').classList.remove('hidden');
}

function retakePhoto() {
    capturedImageBase64 = null;
    document.getElementById('capturedPhoto').classList.add('hidden');
    document.getElementById('btnRetake').classList.add('hidden');
    document.getElementById('btnAnalyze').classList.add('hidden');
    document.getElementById('btnStartCamera').classList.remove('hidden');
    document.getElementById('cameraPlaceholder').classList.remove('hidden');
    document.getElementById('caloriesResult').innerHTML = '';
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        capturedImageBase64 = e.target.result.split(',')[1];
        const photo = document.getElementById('capturedPhoto');
        photo.src = e.target.result;
        photo.classList.remove('hidden');
        document.getElementById('cameraPlaceholder').classList.add('hidden');
        document.getElementById('cameraStream').classList.add('hidden');
        document.getElementById('btnStartCamera').classList.add('hidden');
        document.getElementById('btnCapture').classList.add('hidden');
        document.getElementById('btnRetake').classList.remove('hidden');
        document.getElementById('btnAnalyze').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

async function analyzePhoto() {
    if (!capturedImageBase64) {
        alert('⚠️ Primero toma o sube una foto');
        return;
    }

    const resultDiv = document.getElementById('caloriesResult');
    resultDiv.innerHTML = `
        <div class="glass-card p-8 text-center text-white">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-lg">Analizando imagen con IA...</p>
        </div>
    `;

    try {
        const apiKey = localStorage.getItem('geminiApiKey');
        if (!apiKey) {
            alert('⚠️ Configura tu API Key de Gemini primero');
            return;
        }

        const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

        const prompt = `Analiza esta imagen y dime qué alimento(s) ves. Luego proporciona la información nutricional aproximada.

Responde SOLO con este formato JSON exacto, sin texto adicional:
{
  "nombre": "nombre del alimento identificado",
  "porcion": "porción estimada visible en la imagen",
  "calorias": número,
  "proteina": número en gramos,
  "carbohidratos": número en gramos,
  "grasas": número en gramos,
  "fibra": número en gramos,
  "consejo": "un consejo nutricional corto relacionado con el fitness",
  "confianza": "alta/media/baja"
}`;

        const response = await fetch(GEMINI_API_URL + "?key=" + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: capturedImageBase64 } }
                    ]
                }]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const clean = text.replace(/```json|```/g, '').trim();
        const info = JSON.parse(clean);

        const confianzaColor = info.confianza === 'alta' ? 'text-green-400' : info.confianza === 'media' ? 'text-yellow-400' : 'text-red-400';

        resultDiv.innerHTML = `
            <div class="glass-card p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-white font-bold text-lg">📷 ${info.nombre}</h3>
                    <span class="${confianzaColor} text-sm">Confianza: ${info.confianza}</span>
                </div>
                <p class="text-white/50 text-sm mb-4">Porción estimada: ${info.porcion}</p>

                <div class="text-center bg-white/10 rounded-xl p-4 mb-4">
                    <p class="text-white/60 text-sm">Calorías</p>
                    <p class="text-5xl font-bold text-white">${info.calorias}</p>
                    <p class="text-white/60 text-sm">kcal</p>
                </div>

                <div class="grid grid-cols-3 gap-3 mb-4">
                    <div class="text-center bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                        <p class="text-blue-300 text-xs mb-1">Proteína</p>
                        <p class="text-white font-bold text-xl">${info.proteina}g</p>
                    </div>
                    <div class="text-center bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30">
                        <p class="text-yellow-300 text-xs mb-1">Carbos</p>
                        <p class="text-white font-bold text-xl">${info.carbohidratos}g</p>
                    </div>
                    <div class="text-center bg-red-500/20 rounded-lg p-3 border border-red-400/30">
                        <p class="text-red-300 text-xs mb-1">Grasas</p>
                        <p class="text-white font-bold text-xl">${info.grasas}g</p>
                    </div>
                </div>

                ${info.fibra > 0 ? `<p class="text-white/50 text-sm text-center mb-4">Fibra: ${info.fibra}g</p>` : ''}

                <div class="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3">
                    <p class="text-purple-300 text-sm">💡 ${info.consejo}</p>
                </div>
            </div>
            <p class="text-white/30 text-xs text-center mt-4">* Valores estimados por IA · Pueden variar según preparación y tamaño</p>
        `;

    } catch (error) {
        resultDiv.innerHTML = `
            <div class="glass-card p-6 text-red-400">
                <p class="font-semibold">❌ No se pudo analizar la imagen</p>
                <p class="text-sm mt-2 text-white/60">${error.message}</p>
                <p class="text-sm mt-2 text-white/60">Intenta con otra foto más clara o usa el modo de texto.</p>
            </div>
        `;
    }
}

// ==================== INICIAR ====================
init();