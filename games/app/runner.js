(() => {
  const $ = (id) => document.getElementById(id);

  const canvas = $("rr-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  const distanceEl = $("rr-distance");
  const startOverlay = $("rr-start");
  const overOverlay = $("rr-over");
  const finalEl = $("rr-final");
  const playBtn = $("rr-play");
  const retryBtn = $("rr-retry");

  // ===== Config =====
  const UNITS_PER_PX = 1 / 55;   // 55px ≈ 1 unidad
  const THEME_STEP = 180;        // alterna fondo cada X unidades
  const BLINK_AT = 100;

  const BASE_SPEED = 340;        // px/s
  const SPEED_RAMP = 4.3;        // px/s por segundo

  // Récord (localStorage)
  const LS_KEY = "lovehub_runner_best_v1";

  let gravity = 2400;
  let jumpVel = 860;

  // ===== State =====
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0, groundY = 0;

  let state = "start"; // start | running | over
  let lastT = performance.now();

  let timeAlive = 0;
  let distance = 0;
  let speed = BASE_SPEED;

  let best = 0;

  let nextSpawnIn = 0.85;
  const obstacles = [];
  const particles = [];

  const player = {
    x: 0,
    y: 0,
    vy: 0,
    size: 46,
    onGround: true,

    angle: 0,
    angVel: 0,
    jumpHeightTarget: 140,
  };

  let blinkArmed = true;
  let lastDistanceInt = -1;

  let shakeT = 0;
  let shakeAmp = 0;

  // UI dinámico de récord
  let bestHudEl = null;
  let bestOverEl = null;

  // ===== Utils =====
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  function safeGetBest() {
    try {
      const v = Number(localStorage.getItem(LS_KEY));
      return Number.isFinite(v) ? v : 0;
    } catch {
      return 0;
    }
  }

  function safeSetBest(v) {
    try {
      localStorage.setItem(LS_KEY, String(v));
    } catch {
      // si el navegador bloquea storage, simplemente no persiste
    }
  }

  function ensureBestUI() {
    // HUD
    if (!bestHudEl) {
      const meters = document.querySelector(".rr-meters");
      if (meters) {
        const line = document.createElement("div");
        line.className = "rr-bestline";
        line.innerHTML = `<span>Mejor:</span> <strong id="rr-best">0</strong>`;
        meters.appendChild(line);
        bestHudEl = line.querySelector("#rr-best");
      }
    }

    // Game over card
    if (!bestOverEl) {
      const card = overOverlay?.querySelector(".rr-over-card");
      if (card) {
        const p = document.createElement("p");
        p.className = "rr-over-sub";
        p.innerHTML = `Mejor: <strong id="rr-best-over">0</strong>`;
        // Insertar debajo de la línea de distancia
        const distP = card.querySelector(".rr-over-sub");
        if (distP && distP.nextSibling) {
          card.insertBefore(p, distP.nextSibling);
        } else {
          card.appendChild(p);
        }
        bestOverEl = p.querySelector("#rr-best-over");
      }
    }
  }

  function setBestUI() {
    ensureBestUI();
    const b = String(best);
    if (bestHudEl) bestHudEl.textContent = b;
    if (bestOverEl) bestOverEl.textContent = b;
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    groundY = Math.round(H - Math.min(120, H * 0.22));

    const s = clamp(Math.round(Math.min(W, H) * 0.075), 34, 58);
    player.size = s;

    gravity = clamp(2200 + s * 10, 2200, 3100);

    const jumpH = s * 3.25;
    player.jumpHeightTarget = jumpH;
    jumpVel = Math.sqrt(2 * gravity * jumpH);

    player.x = Math.round(W * 0.18);

    if (player.onGround) {
      player.y = groundY - player.size;
      player.vy = 0;
    }
  }

  function themeUpdate() {
    const idx = Math.floor(distance / THEME_STEP) % 2;
    document.body.classList.toggle("rr-dark", idx === 1);
  }

  function setDistanceUI() {
    const dInt = Math.floor(distance);
    if (dInt !== lastDistanceInt) {
      lastDistanceInt = dInt;
      distanceEl.textContent = String(dInt);

      if (blinkArmed && dInt >= BLINK_AT) {
        blinkArmed = false;
        distanceEl.classList.add("rr-blink");
      }
    }
  }

  function startGame() {
    state = "running";
    timeAlive = 0;
    distance = 0;
    speed = BASE_SPEED;
    nextSpawnIn = 0.75;

    obstacles.length = 0;
    particles.length = 0;

    player.onGround = true;
    player.vy = 0;
    player.y = groundY - player.size;

    player.angle = 0;
    player.angVel = 0;

    shakeT = 0;
    shakeAmp = 0;

    blinkArmed = true;
    lastDistanceInt = -1;
    distanceEl.classList.remove("rr-blink");

    document.body.classList.remove("rr-gameover");
    overOverlay.classList.remove("show");
    startOverlay.classList.remove("show");

    themeUpdate();
    setDistanceUI();
    setBestUI();
  }

  function gameOver(scoreInt) {
    if (state !== "running") return;
    state = "over";

    document.body.classList.add("rr-gameover");

    // guardar récord
    if (scoreInt > best) {
      best = scoreInt;
      safeSetBest(best);
    }
    setBestUI();

    finalEl.textContent = String(scoreInt);
    overOverlay.classList.add("show");

    shakeT = 0.35;
    shakeAmp = 10;

    spawnBurstParticles();
  }

  function spawnBurstParticles() {
    const s = player.size;
    const cx = player.x + s / 2;
    const cy = player.y + s / 2;

    const count = 40;
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(200, 560);
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - rand(90, 260),
        life: rand(0.55, 1.05),
        r: rand(2, 5),
      });
    }
  }

  function spawnDust(atX, atY) {
    const n = 10;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: atX + rand(-10, 10),
        y: atY + rand(-3, 3),
        vx: rand(-120, 120),
        vy: rand(-220, -80),
        life: rand(0.22, 0.40),
        r: rand(1.5, 3.2),
      });
    }
  }

  function jump() {
    if (state === "start" || state === "over") {
      startGame();
    }
    if (state !== "running") return;
    if (!player.onGround) return;

    player.onGround = false;
    player.vy = -jumpVel;

    const airTime = Math.max(0.55, (2 * jumpVel) / gravity);
    player.angVel = (Math.PI * 2) / airTime;

    spawnDust(player.x + player.size * 0.5, groundY + 1);
  }

  function pickSpawnDelay(currentSpeed) {
    const t = clamp(1 - currentSpeed / 900, 0.25, 1);
    const base = 0.72 + 0.55 * t;
    return base + Math.random() * (0.45 + 0.25 * t);
  }

  function spawnObstacle() {
    const s = clamp(Math.round(player.size * rand(0.85, 1.12)), 26, 70);
    obstacles.push({ x: W + 40, size: s });

    if (Math.random() < 0.26) {
      obstacles.push({
        x: W + 40 + s + rand(28, 70),
        size: clamp(Math.round(s * rand(0.85, 1.05)), 24, 70),
      });
    }
  }

  function rectOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function paddedRect(x, y, w, h, pad) {
    const px = w * pad;
    const py = h * pad;
    return { x: x + px, y: y + py, w: w - px * 2, h: h - py * 2 };
  }

  function checkCollisions() {
    const ps = player.size;
    const pRect = paddedRect(player.x, player.y, ps, ps, 0.18);

    for (const o of obstacles) {
      const ox = o.x;
      const oy = groundY - o.size;
      const ow = o.size;
      const oh = o.size;

      const oRect = paddedRect(ox, oy, ow, oh, 0.22);

      if (rectOverlap(pRect, oRect)) {
        const scoreInt = Math.floor(distance);
        gameOver(scoreInt);
        return;
      }
    }
  }

  // ===== Update & Draw =====
  function update(dt) {
    if (state === "running") {
      timeAlive += dt;
      speed = BASE_SPEED + timeAlive * SPEED_RAMP;

      distance += speed * dt * UNITS_PER_PX;
      themeUpdate();
      setDistanceUI();

      nextSpawnIn -= dt;
      if (nextSpawnIn <= 0) {
        spawnObstacle();
        nextSpawnIn = pickSpawnDelay(speed);
      }

      if (!player.onGround) {
        player.vy += gravity * dt;
        player.y += player.vy * dt;

        player.angle += player.angVel * dt;

        if (player.y + player.size >= groundY) {
          player.y = groundY - player.size;
          player.vy = 0;
          player.onGround = true;

          const q = Math.PI / 2;
          player.angle = Math.round(player.angle / q) * q;
          player.angVel = 0;

          spawnDust(player.x + player.size * 0.5, groundY + 1);
        }
      } else {
        player.y = groundY - player.size;
      }

      for (const o of obstacles) o.x -= speed * dt;
      while (obstacles.length && obstacles[0].x + obstacles[0].size < -80) obstacles.shift();

      checkCollisions();
    } else {
      if (player.onGround) player.y = groundY - player.size;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;

      p.vy += (gravity * 0.55) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.25, dt);

      if (p.life <= 0) particles.splice(i, 1);
    }

    if (shakeT > 0) {
      shakeT -= dt;
      if (shakeT <= 0) shakeAmp = 0;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    let sx = 0, sy = 0;
    if (shakeAmp > 0) {
      sx = (Math.random() - 0.5) * shakeAmp;
      sy = (Math.random() - 0.5) * shakeAmp;
    }

    ctx.save();
    ctx.translate(sx, sy);

    const isDark = document.body.classList.contains("rr-dark");

    const inkA = isDark ? "#f5f5f7" : "#1d1d1f";
    const inkB = isDark ? "#cfd4dc" : "#0b0b10";
    const lineSoft = isDark ? "rgba(245,245,247,.28)" : "rgba(29,29,31,.18)";

    ctx.lineWidth = 2;
    ctx.strokeStyle = lineSoft;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 1);
    ctx.lineTo(W, groundY + 1);
    ctx.stroke();

    for (const o of obstacles) {
      const x = o.x;
      const y = groundY;
      const s = o.size;

      ctx.save();
      const g = ctx.createLinearGradient(x, y - s, x + s, y);
      g.addColorStop(0, inkA);
      g.addColorStop(1, inkB);

      ctx.fillStyle = g;
      ctx.globalAlpha = 0.96;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x + s / 2, y - s);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = isDark ? 0.10 : 0.08;
      ctx.strokeStyle = inkA;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }

    const s = player.size;
    const px = player.x;
    const py = player.y;

    const height = Math.max(0, groundY - (py + s));
    const t = clamp(1 - height / (player.jumpHeightTarget * 1.05), 0.28, 1);

    ctx.save();
    ctx.globalAlpha = isDark ? 0.20 : 0.16;
    ctx.fillStyle = inkA;
    ctx.beginPath();
    ctx.ellipse(
      px + s / 2,
      groundY + 12,
      (s * 0.55) * t,
      (s * 0.16) * t,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(px + s / 2, py + s / 2);
    ctx.rotate(player.angle);

    const cg = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
    cg.addColorStop(0, inkA);
    cg.addColorStop(1, inkB);

    ctx.globalAlpha = 0.98;
    ctx.fillStyle = cg;
    ctx.fillRect(-s / 2, -s / 2, s, s);

    ctx.globalAlpha = isDark ? 0.18 : 0.12;
    ctx.strokeStyle = inkA;
    ctx.lineWidth = 2;
    ctx.strokeRect(-s / 2 + 1, -s / 2 + 1, s - 2, s - 2);

    ctx.restore();

    if (particles.length) {
      for (const p of particles) {
        const a = clamp(p.life, 0, 1);
        ctx.globalAlpha = a * (isDark ? 0.9 : 0.8);

        const pg = ctx.createLinearGradient(p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r);
        pg.addColorStop(0, inkA);
        pg.addColorStop(1, inkB);
        ctx.fillStyle = pg;

        ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function tick(t) {
    const dtRaw = (t - lastT) / 1000;
    lastT = t;
    const dt = clamp(dtRaw, 0, 0.05);

    update(dt);
    draw();

    requestAnimationFrame(tick);
  }

  // ===== Input =====
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    }
    if (e.code === "KeyR") {
      if (state === "over" || state === "start") startGame();
    }
  });

  let tapActive = false;
  let sx = 0, sy = 0, t0 = 0;
  const TAP_MAX_MOVE = 14;
  const TAP_MAX_TIME = 280;

  window.addEventListener("pointerdown", (e) => {
    if (tapActive) return;
    tapActive = true;
    sx = e.clientX; sy = e.clientY;
    t0 = performance.now();
    try { e.target.setPointerCapture(e.pointerId); } catch {}
  });

  window.addEventListener("pointerup", (e) => {
    if (!tapActive) return;
    tapActive = false;

    const dt = performance.now() - t0;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    const moved = Math.hypot(dx, dy);

    if (dt <= TAP_MAX_TIME && moved <= TAP_MAX_MOVE) {
      jump();
    }
  });

  window.addEventListener("pointercancel", () => { tapActive = false; });

  playBtn.addEventListener("click", startGame);
  retryBtn.addEventListener("click", startGame);

  // ===== Boot =====
  window.addEventListener("resize", resize);

  best = safeGetBest();
  ensureBestUI();
  setBestUI();

  resize();
  setDistanceUI();
  requestAnimationFrame(tick);
})();