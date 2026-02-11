let FL = null;

function initFlappyLove() {
  const stage = document.getElementById("fl-love-stage");
  const bird  = document.getElementById("fl-love-bird");
  const obs   = document.getElementById("fl-love-obstacles");

  const overlay = document.getElementById("fl-love-overlay");
  const titleEl = document.getElementById("fl-love-title");
  const subEl   = document.getElementById("fl-love-sub");
  const startBtn = document.getElementById("fl-love-start");

  const scoreEl = document.getElementById("fl-love-score");
  const bestEl  = document.getElementById("fl-love-best");
  const miniRestart = document.getElementById("fl-love-mini-restart");

  if (!stage || !bird || !obs || !overlay || !titleEl || !subEl || !startBtn || !scoreEl || !bestEl) {
    console.error("[FlappyLove] Falta algún elemento del HTML.");
    return;
  }

  const BEST_KEY = "flLoveBestScore_v4";

  FL = {
    stage, bird, obs,
    overlay, titleEl, subEl, startBtn,
    scoreEl, bestEl, miniRestart,
    BEST_KEY,

    w: 0, h: 0,
    groundH: 56,

    // pingüino
    birdSize: 46,
    birdX: 0,

    y: 0,
    vy: 0,
    gravity: 1550,
    jump: 520,

    running: false,
    dead: false,
    started: false,

    score: 0,
    best: Number(localStorage.getItem(BEST_KEY) || 0),

    pipes: [],
    spawnT: 0,
    spawnEvery: 1.25,
    speed: 250,
    gap: 175,
    pipeW: 72,

    lastTs: 0,
    raf: 0,
  };

  FL.bestEl.textContent = String(FL.best);

  // medir cuando ya hay layout
  requestAnimationFrame(() => {
    measure();
    reset(true);
    paintBird();
    showOverlay("Toca(me) para jugar", "", "▶ Jugar");
  });

  // Botón Jugar/Reintentar (móvil)
  const pressStart = (e) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    startGame();
  };
  startBtn.addEventListener("pointerdown", pressStart, { passive: false });
  startBtn.addEventListener("click", (e) => { e.stopPropagation(); startGame(); });

  // mini restart
  if (miniRestart) miniRestart.addEventListener("click", () => reset(false));

  // overlay: tap fuera de la tarjeta = jugar
  overlay.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".fl-love-overlay-card")) return;
    if (e.cancelable) e.preventDefault();
    startGame();
  }, { passive: false });

  // stage: solo saltar si overlay no está visible
  stage.addEventListener("pointerdown", (e) => {
    if (FL.overlay.classList.contains("show")) return;
    if (e.cancelable) e.preventDefault();
    if (!FL.started) startGame();
    else if (!FL.dead) doJump();
  }, { passive: false });

  // teclado
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === " " || k === "arrowup" || k === "w") {
      e.preventDefault();
      if (!FL.started) startGame();
      else if (!FL.dead) doJump();
    }
    if (k === "r") reset(false);
  });

  window.addEventListener("resize", () => {
    measure();
    FL.y = clamp(FL.y, 10, (FL.h - FL.groundH) - FL.birdSize - 10);
    paintBird();
  });
}

function measure() {
  const r = FL.stage.getBoundingClientRect();
  FL.w = Math.floor(r.width);
  FL.h = Math.floor(r.height);

  FL.birdX = Math.round(FL.w * 0.28);

  // gap responsive
  const g = Math.round(FL.h * 0.27);
  FL.gap = clamp(g, 155, 210);

  FL.pipeW = 72;
}

function startGame() {
  if (FL.running) return;

  reset(true);
  hideOverlay();

  FL.started = true;
  FL.dead = false;
  FL.running = true;

  doJump();
  FL.lastTs = 0;
  FL.raf = requestAnimationFrame(loop);
}

function reset(keepOverlayHidden) {
  cancelAnimationFrame(FL.raf);

  FL.running = false;
  FL.dead = false;
  FL.started = false;

  FL.score = 0;
  FL.scoreEl.textContent = "0";

  FL.vy = 0;
  FL.y = Math.round(FL.h * 0.45);

  FL.spawnT = 0;
  FL.speed = 250;

  FL.pipes.forEach(p => p.el.remove());
  FL.pipes = [];
  FL.obs.innerHTML = "";

  FL.stage.classList.remove("shake");

  paintBird();

  if (!keepOverlayHidden) {
    showOverlay("", "▶ Jugar");
  }
}

function loop(ts) {
  if (!FL.running) return;

  if (!FL.lastTs) FL.lastTs = ts;
  const dt = Math.min(0.033, (ts - FL.lastTs) / 1000);
  FL.lastTs = ts;

  step(dt);
  FL.raf = requestAnimationFrame(loop);
}

function step(dt) {
  FL.vy += FL.gravity * dt;
  FL.y += FL.vy * dt;

  paintBird();

  FL.spawnT += dt;
  if (FL.spawnT >= FL.spawnEvery) {
    FL.spawnT = 0;
    spawnPipe();
  }

  const birdRect = getBirdRect();
  const playH = FL.h - FL.groundH;

  for (let i = FL.pipes.length - 1; i >= 0; i--) {
    const p = FL.pipes[i];
    p.x -= FL.speed * dt;
    p.el.style.transform = `translateX(${p.x}px)`;

    if (!p.passed && (p.x + FL.pipeW) < FL.birdX) {
      p.passed = true;
      setScore(FL.score + 1);
      FL.speed = Math.min(370, FL.speed + 6);
    }

    const topRect = { left: p.x, right: p.x + FL.pipeW, top: 0, bottom: p.topH };
    const botRect = { left: p.x, right: p.x + FL.pipeW, top: p.topH + FL.gap, bottom: playH };

    if (hit(birdRect, topRect) || hit(birdRect, botRect)) return gameOver();
    if (p.x < -FL.pipeW - 30) { p.el.remove(); FL.pipes.splice(i, 1); }
  }

  if (FL.y < 0) return gameOver();
  if (FL.y + FL.birdSize > (FL.h - FL.groundH)) return gameOver();
}

function spawnPipe() {
  const playH = FL.h - FL.groundH;

  const minTop = 70;
  const maxTop = playH - FL.gap - 85;
  const topH = Math.floor(rand(minTop, Math.max(minTop + 10, maxTop)));

  const el = document.createElement("div");
  el.className = "fl-love-pipepair";
  el.style.width = `${FL.pipeW}px`;

  const top = document.createElement("div");
  top.className = "fl-love-pipe fl-love-pipe-top";
  top.style.height = `${topH}px`;

  const bot = document.createElement("div");
  bot.className = "fl-love-pipe fl-love-pipe-bot";
  bot.style.height = `${playH - (topH + FL.gap)}px`;

  el.appendChild(top);
  el.appendChild(bot);

  FL.obs.appendChild(el);

  const p = { el, x: FL.w + 40, topH, passed: false };
  el.style.transform = `translateX(${p.x}px)`;
  FL.pipes.push(p);
}

function doJump() {
  FL.vy = -FL.jump;
  FL.bird.classList.remove("fl-love-flap");
  void FL.bird.offsetWidth;
  FL.bird.classList.add("fl-love-flap");
}

function paintBird() {
  const ang = clamp(map(FL.vy, -650, 900, -12, 22), -16, 24);
  FL.bird.style.left = `${FL.birdX}px`;
  FL.bird.style.transform = `translateY(${FL.y}px) rotate(${ang}deg)`;
}

function getBirdRect() {
  const pad = 7;
  return {
    left: FL.birdX + pad,
    right: FL.birdX + FL.birdSize - pad,
    top: FL.y + pad,
    bottom: FL.y + FL.birdSize - pad
  };
}

function setScore(v) {
  FL.score = v;
  FL.scoreEl.textContent = String(v);
}

function gameOver() {
  if (FL.dead) return;

  FL.dead = true;
  FL.running = false;
  cancelAnimationFrame(FL.raf);

  FL.stage.classList.add("shake");

  if (FL.score > FL.best) {
    FL.best = FL.score;
    FL.bestEl.textContent = String(FL.best);
    localStorage.setItem(FL.BEST_KEY, String(FL.best));
    showOverlay("¡Nuevo récord!", "", "🔁 Reintentar");
  } else {
    showOverlay("Game Over", "", "🔁 Reintentar");
  }
}

function showOverlay(title, sub, btnText) {
  FL.titleEl.textContent = title;
  FL.subEl.textContent = sub;
  FL.startBtn.textContent = btnText;
  FL.overlay.classList.add("show");
}
function hideOverlay() { FL.overlay.classList.remove("show"); }

function hit(A, B) {
  return !(A.right <= B.left || A.left >= B.right || A.bottom <= B.top || A.top >= B.bottom);
}
function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, mi, ma) { return Math.max(mi, Math.min(ma, v)); }
function map(v, inMin, inMax, outMin, outMax) {
  const t = (v - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}
