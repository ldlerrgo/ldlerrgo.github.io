let WAM = null;

async function initWhackAMole() {
  const stage = document.getElementById("wam-stage");
  const overlay = document.getElementById("wam-overlay");
  const titleEl = document.getElementById("wam-title");
  const subEl = document.getElementById("wam-sub");
  const startBtn = document.getElementById("wam-start");
  const scoreEl = document.getElementById("wam-score");
  const bestEl = document.getElementById("wam-best");
  const livesEl = document.getElementById("wam-lives");
  const miniRestart = document.getElementById("wam-mini-restart");

  if (!stage || !overlay || !titleEl || !subEl || !startBtn || !scoreEl || !bestEl || !livesEl) {
    console.error("[WAM] Falta algún elemento del HTML.");
    return;
  }

  let imgs = [];
  try { if (typeof getImages === "function") imgs = await getImages(); } catch (_) {}
  if (!Array.isArray(imgs)) imgs = [];

  const BEST_KEY = "wamBestScore_v4";

  WAM = {
    stage, overlay, titleEl, subEl, startBtn,
    scoreEl, bestEl, livesEl, miniRestart,
    imgs,
    BEST_KEY,

    holes: [],
    actives: new Map(),

    running: false,

    score: 0,
    best: Number(localStorage.getItem(BEST_KEY) || 0),

    lives: 3,
    misses: 0,
    missCap: 3,

    nextTimer: 0,

    baseInterval: 1650,
    minInterval: 760,

    baseUpTime: 1300,
    minUpTime: 620,

    kSpeed: 0.70,
    kUp: 0.62,

    bombBase: 0.18,

    doubleBase: 0.02,
    doubleMax: 0.16,
    doubleK: 0.055,
    doubleDelayMin: 150,
    doubleDelayMax: 520
  };

  WAM.bestEl.textContent = String(WAM.best);

  buildGrid(9);
  renderLives();

  const startPress = (e) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    startGame();
  };
  startBtn.addEventListener("pointerdown", startPress, { passive: false });
  startBtn.addEventListener("click", (e) => { e.stopPropagation(); startGame(); });

  overlay.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".wam-overlay-card")) return;
    if (e.cancelable) e.preventDefault();
    startGame();
  }, { passive: false });

  if (miniRestart) miniRestart.addEventListener("click", () => reset(false));

  showOverlay("Toca para jugar", "Toca imágenes para sumar. 💣 quita vida.", "▶ Jugar");
}

function buildGrid(n) {
  WAM.stage.innerHTML = "";
  WAM.holes = [];

  for (let i = 0; i < n; i++) {
    const hole = document.createElement("div");
    hole.className = "wam-hole";
    hole.dataset.idx = String(i);

    const rim = document.createElement("div");
    rim.className = "wam-rim";

    const pop = document.createElement("button");
    pop.type = "button";
    pop.className = "wam-pop";
    pop.setAttribute("aria-label", "Golpear");
    pop.dataset.idx = String(i);

    pop.addEventListener("pointerdown", (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      whack(i);
    }, { passive: false });

    hole.appendChild(rim);
    hole.appendChild(pop);
    WAM.stage.appendChild(hole);

    WAM.holes.push({ hole, pop, idx: i });
  }
}

function startGame() {
  if (WAM.running) return;
  reset(true);
  hideOverlay();
  WAM.running = true;
  scheduleNext(320);
}

function reset(keepOverlayHidden) {
  clearTimeout(WAM.nextTimer);
  WAM.running = false;

  WAM.score = 0;
  WAM.lives = 3;
  WAM.misses = 0;

  WAM.scoreEl.textContent = "0";
  renderLives();

  clearAllActives();

  WAM.holes.forEach(h => {
    h.pop.classList.remove("up", "bomb", "hit", "miss");
    h.pop.innerHTML = "";
  });

  if (!keepOverlayHidden) {
    showOverlay("Toca para jugar", "Toca imágenes para sumar. 💣 quita vida.", "▶ Jugar");
  } else {
    hideOverlay();
  }
}

function scheduleNext(delayMs) {
  clearTimeout(WAM.nextTimer);
  WAM.nextTimer = setTimeout(() => {
    if (!WAM.running) return;
    tickSpawn();
  }, delayMs);
}

function tickSpawn() {
  spawnSingle();

  if (Math.random() < doubleChance(WAM.score)) {
    const d = randInt(WAM.doubleDelayMin, WAM.doubleDelayMax);
    setTimeout(() => {
      if (!WAM.running) return;
      spawnSingle();
    }, d);
  }

  scheduleNext(getInterval(WAM.score));
}

function spawnSingle() {
  const idx = pickFreeHoleIndex();
  if (idx === null) return;

  const h = WAM.holes[idx];
  const isBomb = Math.random() < bombChance(WAM.score);

  h.pop.classList.remove("hit", "miss");
  h.pop.classList.toggle("bomb", isBomb);

  if (isBomb) {
    h.pop.innerHTML = `<span class="wam-bomb" aria-hidden="true">💣</span>`;
  } else {
    const img = pickImage();
    if (img) h.pop.innerHTML = `<img class="wam-img" src="../img/${img}" alt="mole">`;
    else h.pop.innerHTML = `<span class="wam-fallback">⭐</span>`;
  }

  h.pop.classList.add("up");

  const active = { type: isBomb ? "bomb" : "img", hit: false, timeoutId: 0 };
  WAM.actives.set(idx, active);

  active.timeoutId = setTimeout(() => {
    hideIdx(idx);
  }, getUpTime(WAM.score));
}

function hideIdx(idx) {
  const h = WAM.holes[idx];
  const active = WAM.actives.get(idx);

  if (active && active.type === "img" && !active.hit) {
    registerMiss(idx);
  }

  if (active) clearTimeout(active.timeoutId);
  WAM.actives.delete(idx);

  h.pop.classList.remove("up", "hit");
  setTimeout(() => {
    h.pop.innerHTML = "";
    h.pop.classList.remove("bomb");
  }, 130);
}

function whack(idx) {
  if (!WAM.running) return;

  const active = WAM.actives.get(idx);

  if (!active) {
    registerMiss(idx);
    return;
  }

  const h = WAM.holes[idx];
  clearTimeout(active.timeoutId);
  active.hit = true;

    if (active.type === "bomb") {
    WAM.lives -= 1;
    WAM.misses = 0;
    renderLives();

    h.pop.innerHTML = `<span class="wam-bomb" aria-hidden="true">💥</span>`;

    setTimeout(() => hideIdx(idx), 180);

    if (WAM.lives <= 0) return gameOver();
    } else {
    WAM.score += 1;
    WAM.scoreEl.textContent = String(WAM.score);
    WAM.misses = 0;

    h.pop.classList.add("hit");
    setTimeout(() => hideIdx(idx), 120);
    }
}

function registerMiss(idx) {
  const h = WAM.holes[idx];
  h.pop.classList.remove("miss");
  void h.pop.offsetWidth;
  h.pop.classList.add("miss");

  WAM.misses += 1;

  if (WAM.misses >= WAM.missCap) {
    WAM.misses = 0;
    WAM.lives -= 1;
    renderLives();
    if (WAM.lives <= 0) gameOver();
  }
}

function gameOver() {
  WAM.running = false;
  clearTimeout(WAM.nextTimer);
  clearAllActives();

  if (WAM.score > WAM.best) {
    WAM.best = WAM.score;
    localStorage.setItem(WAM.BEST_KEY, String(WAM.best));
    WAM.bestEl.textContent = String(WAM.best);
    showOverlay("¡Nuevo récord!", `Puntos: ${WAM.score}`, "🔁 Reintentar");
  } else {
    showOverlay("Game Over", `Puntos: ${WAM.score}`, "🔁 Reintentar");
  }
}

function clearAllActives() {
  for (const [idx, active] of WAM.actives.entries()) {
    clearTimeout(active.timeoutId);
    const h = WAM.holes[idx];
    if (h) {
      h.pop.classList.remove("up", "hit");
      h.pop.innerHTML = "";
      h.pop.classList.remove("bomb");
    }
  }
  WAM.actives.clear();
}

function renderLives() {
  const total = 3;
  const left = Math.max(0, Math.min(total, WAM.lives));
  let html = "";
  for (let i = 0; i < total; i++) {
    html += `<span class="wam-life ${i < left ? "on" : "off"}" aria-hidden="true">●</span>`;
  }
  WAM.livesEl.innerHTML = html;
}

function showOverlay(title, sub, btnText) {
  WAM.titleEl.textContent = title;
  WAM.subEl.textContent = sub;
  WAM.startBtn.textContent = btnText;
  WAM.overlay.classList.add("show");
}

function hideOverlay() {
  WAM.overlay.classList.remove("show");
}

function pickFreeHoleIndex() {
  const free = [];
  for (let i = 0; i < WAM.holes.length; i++) {
    if (!WAM.actives.has(i)) free.push(i);
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

function pickImage() {
  if (!WAM.imgs || WAM.imgs.length === 0) return null;
  return WAM.imgs[Math.floor(Math.random() * WAM.imgs.length)];
}

function bombChance(score) {
  const extra = Math.min(0.14, Math.log1p(score) * 0.03);
  return Math.min(0.38, WAM.bombBase + extra);
}

function doubleChance(score) {
  const p = WAM.doubleBase + Math.min(WAM.doubleMax - WAM.doubleBase, Math.log1p(score) * WAM.doubleK);
  return Math.max(0, Math.min(WAM.doubleMax, p));
}

function getInterval(score) {
  const t = Math.log1p(score) * WAM.kSpeed;
  const span = WAM.baseInterval - WAM.minInterval;
  return Math.round(WAM.minInterval + span / (1 + t));
}

function getUpTime(score) {
  const t = Math.log1p(score) * WAM.kUp;
  const span = WAM.baseUpTime - WAM.minUpTime;
  return Math.round(WAM.minUpTime + span / (1 + t));
}

function randInt(a, b) {
  return Math.floor(a + Math.random() * (b - a + 1));
}
