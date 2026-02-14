let audio;
let originalBeats = [];
let currentBeats = [];
let score = 0;
let lives = 3;
let combo = 0;
let activeTiles = [];
let gameRunning = false;

// Tiempos y configuración
let gameStartTime = 0;
let audioStarted = false;

// FALL_DURATION: Tiempo (ms) que tarda la nota en recorrer la pantalla.
// AUDIO_DELAY: Tiempo de espera para sincronizar.
const FALL_DURATION = 2000;
const AUDIO_DELAY = 2000; 

const countdownEl = document.getElementById('countdown');
const retryBtn = document.getElementById('retry-btn');
const livesContainer = document.getElementById('lives');
const scoreEl = document.getElementById('score');
const bgBody = document.querySelector('.rythm-body');

async function init() {
    const params = new URLSearchParams(window.location.search);
    const songId = params.get('song') || 'heaven'; 

    try {
        const songsRes = await fetch('./listacanciones.json');
        const songs = await songsRes.json();
        const songData = songs.find(s => s.id === songId);

        if (!songData) {
            console.error("Canción no encontrada");
            return;
        }

        const beatmapRes = await fetch(songData.beatmap);
        const beatmapData = await beatmapRes.json();

        originalBeats = [...beatmapData.beats].sort((a, b) => a - b);
        
        audio = new Audio(songData.audio);
        audio.preload = "auto";
        audio.volume = 0.6;

        startCountdown();

    } catch (error) {
        console.error("Error cargando archivos:", error);
    }
}

function startCountdown() {
    let count = 3;

    // Resetear variables
    gameRunning = false;
    currentBeats = [...originalBeats];
    score = 0;
    lives = 3;
    combo = 0;
    audioStarted = false;
    
    // Resetear Audio
    if(audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    // Limpiar notas en pantalla
    activeTiles.forEach(t => t.element.remove());
    activeTiles = [];

    // Resetear UI
    updateScoreUI();
    updateLivesUI();
    document.getElementById('game-over').classList.remove('show');
    bgBody.style.animationDuration = '10s';

    countdownEl.textContent = '';

    const interval = setInterval(() => {
        if (count > 0) {
            countdownEl.textContent = count;
            countdownEl.classList.remove('count-pop');
            void countdownEl.offsetWidth; // Trigger reflow
            countdownEl.classList.add('count-pop');
            count--;
        } else {
            clearInterval(interval);
            countdownEl.textContent = '¡YA!';
            setTimeout(() => {
                countdownEl.textContent = '';
                startGame();
            }, 500);
        }
    }, 1000);
}

function startGame() {
    gameRunning = true;
    gameStartTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function spawnTile(beatTime) {
    const laneIdx = Math.floor(Math.random() * 3);
    const lane = document.getElementById(`lane-${laneIdx}`);

    const tileEl = document.createElement('div');
    tileEl.className = 'tile';
    
    // Referencia lógica
    const tileObj = {
        element: tileEl,
        lane: laneIdx,
        spawnTime: beatTime, 
        hitTime: beatTime + FALL_DURATION, 
        processed: false
    };

    lane.appendChild(tileEl);
    activeTiles.push(tileObj);
}

function gameLoop() {
    if (!gameRunning) return;

    const now = performance.now();
    const elapsed = now - gameStartTime;

    // 1. Gestión del Audio
    if (!audioStarted && elapsed >= AUDIO_DELAY) {
        audioStarted = true;
        audio.play().catch(e => console.log("Esperando interacción user...", e));
    }

    // 2. Spawneamos notas
    while (currentBeats.length > 0 && elapsed >= currentBeats[0]) {
        spawnTile(currentBeats.shift());
    }

    // 3. Movemos y limpiamos notas
    for (let i = activeTiles.length - 1; i >= 0; i--) {
        const tile = activeTiles[i];
        
        const timeAlive = elapsed - tile.spawnTime;
        const progress = timeAlive / FALL_DURATION;

        // VisualY: 0% es arriba, 100% es abajo.
        // Dado que la barra ahora está cerca del 95% (bottom: 5%),
        // el 100% será justo después de la barra.
        const visualY = progress * 100;
        tile.element.style.top = `${visualY}%`;

        // --- Lógica de "Miss" (CORREGIDA) ---
        // Antes era 1.15. Ahora, como la barra está más abajo, 
        // si pasa de 1.05 (105%), significa que ya salió de la pantalla visualmente.
        if (progress > 1.05) { 
            loseLife();
            tile.element.remove(); 
            activeTiles.splice(i, 1); 
        }
    }

    // Ajustar velocidad del fondo
    if(combo > 10) bgBody.style.animationDuration = '4s';
    else bgBody.style.animationDuration = '10s';

    requestAnimationFrame(gameLoop);
}

function checkHit(laneIdx) {
    if (!gameRunning) return;

    const now = performance.now();
    const elapsed = now - gameStartTime;
    const hitZoneWindow = 300;

    const hitIndex = activeTiles.findIndex(t =>
        t.lane === laneIdx &&
        Math.abs(elapsed - t.hitTime) < hitZoneWindow
    );

    if (hitIndex !== -1) {

        const tile = activeTiles[hitIndex];

        score += 100 + (combo * 10);
        combo++;

        if (combo % 5 === 0 && lives < 3) {
            lives++;
            updateLivesUI();
            const livesEl = document.getElementById('lives');
            livesEl.style.transform = "scale(1.2)";
            setTimeout(() => livesEl.style.transform = "scale(1)", 200);
        }

        tile.element.classList.add('hit-effect');
        activeTiles.splice(hitIndex, 1);

        setTimeout(() => {
            if (tile.element.parentNode) tile.element.remove();
        }, 150);

        updateScoreUI();

    } else {

        loseLife();

    }
}


function loseLife() {
    if (lives <= 0 || !gameRunning) return;

    lives--;
    combo = 0;
    updateLivesUI();
    
    const hud = document.querySelector('.rythm-hud');
    hud.classList.add('shake');
    setTimeout(() => hud.classList.remove('shake'), 300);

    if (lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameRunning = false;
    audio.pause();
    
    activeTiles.forEach(t => t.element.remove());
    activeTiles = [];

    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.add('show');
}

function updateScoreUI() {
    scoreEl.textContent = score.toString().padStart(6, '0');
}

function updateLivesUI() {
    const hearts = document.querySelectorAll('.wam-life');
    hearts.forEach((heart, index) => {
        if (index < lives) {
            heart.classList.add('on');
            heart.classList.remove('off');
        } else {
            heart.classList.add('off');
            heart.classList.remove('on');
        }
    });
}

// --- CONTROLES ---

retryBtn.onclick = () => {
    startCountdown();
};

window.onkeydown = e => {
    if (!gameRunning) return;
    const key = e.key.toUpperCase();
    if (key === 'Q') checkHit(0);
    if (key === 'W') checkHit(1);
    if (key === 'E') checkHit(2);
};

// Configurar Touch
['lane-0', 'lane-1', 'lane-2'].forEach((id, idx) => {
    const el = document.getElementById(id);
    
    el.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        checkHit(idx);
        el.classList.add('lane-active');
    }, {passive: false});

    el.addEventListener('touchend', () => {
        el.classList.remove('lane-active');
    });
});

// Arrancar
init();