(() => {
  const canvas = document.getElementById("rtCanvas");
  const ctx = canvas.getContext("2d");
  const wrap = document.getElementById("rtWheelWrap");
  const pointer = document.getElementById("rtPointer");

  // ===== CONFIG (constantes) =====
  const FAKEOUT_PROB = 0.50;
  const MAIN_MS = 8200;
  const SETTLE_MS = 420;
  const MIN_FONT_PX = 10;
  const LABEL_RADIAL_CENTER = 0.50;
  // =================================

  const TAU = Math.PI * 2;

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0, R = 0, CX = 0, CY = 0;

  let options = [];
  let colors = [];
  let seg = 0;

  // rotación absoluta (puede crecer)
  let rot = 0;

  // estados
  let state = "idle"; // idle | main | settle
  let startAt = 0;

  // targets absolutos
  let rotStart = 0;
  let rotTeaseAbs = 0;
  let rotWinAbs = 0;

  let winnerIndex = 0;
  let fakeout = false;

  // highlight del ganador (borde blanco tipo flecha)
  let highlightIndex = null;

  // partículas/brillo
  let sparks = [];
  let finishFx = 2;

  // ---------- utils ----------
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function mod(a, n){ return ((a % n) + n) % n; }
  function rand(a, b){ return a + Math.random() * (b - a); }
  function smoothStep(t){ t = clamp(t,0,1); return t*t*(3-2*t); }

  // Easing “anterior” (suave, acelera y desacelera largo sin cortes)
  function smoothSpinProgress(t, a = 2.4, b = 7.2){
    t = clamp(t, 0, 1);
    const ta = Math.pow(t, a);
    const tb = Math.pow(1 - t, b);
    return ta / (ta + tb);
  }

  function resize(){
    const rect = canvas.getBoundingClientRect();
    W = Math.max(10, rect.width);
    H = Math.max(10, rect.height);

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    CX = W / 2;
    CY = H / 2;
    R = Math.min(W, H) * 0.5 - 2;

    draw(0);
  }

  function gcd(a, b){
    while (b) [a, b] = [b, a % b];
    return a;
  }

  function buildOrder(n){
    if (n <= 2) return [...Array(n)].map((_, i) => i);
    let step = Math.floor(n * 0.618) + 1;
    while (gcd(step, n) !== 1) step++;
    const order = [];
    let x = 0;
    for (let i = 0; i < n; i++){
      order.push(x);
      x = (x + step) % n;
    }
    return order;
  }

  function hslToRgb(h, s, l){
    h = mod(h, 360) / 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) r = g = b = l;
    else{
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function rgbToCss({r,g,b}, a=1){
    return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
  }

  function luminance({r,g,b}){
    const srgb = [r,g,b].map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  function generateColors(n){
    const order = buildOrder(n);
    const baseHue = Math.floor(Math.random() * 360);
    const s = 60;

    const raw = new Array(n);
    for (let i = 0; i < n; i++){
      const hue = baseHue + (360 * i / n);
      const l = 53 + Math.sin((i / n) * Math.PI * 2) * 3;
      const center = hslToRgb(hue, s, l);
      const outer  = hslToRgb(hue, s, l - 12);
      const txt = luminance(center) < 0.46 ? "#ffffff" : "#1d1d1f";
      raw[i] = { center, outer, text: txt };
    }

    const out = new Array(n);
    for (let pos = 0; pos < n; pos++) out[pos] = raw[order[pos]];
    return out;
  }

  function pickWinner(){
    return Math.floor(Math.random() * options.length);
  }

  function buildAbsTarget(rotFrom, targetMod, spins){
    const fromMod = mod(rotFrom, TAU);
    const delta = mod(targetMod - fromMod, TAU);
    return rotFrom + spins * TAU + delta;
  }

  // recorta con ellipsis para que NUNCA se salga
  function ellipsizeToFit(text, maxWidth){
    const ell = "…";
    if (ctx.measureText(text).width <= maxWidth) return text;
    if (ctx.measureText(ell).width > maxWidth) return "";

    let lo = 0, hi = text.length;
    while (lo < hi){
      const mid = Math.ceil((lo + hi) / 2);
      const s = text.slice(0, mid) + ell;
      if (ctx.measureText(s).width <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    return text.slice(0, lo) + ell;
  }

  // Texto radial: del centro hacia afuera, centrado en r=0.5R, sin voltearse nunca.
  function drawRadialLabel(i, midAngle){
    const c = colors[i];
    let text = String(options[i] ?? "");
    if (!text) return;

    // límites del “contenedor” radial y márgenes
    const hubR = R * 0.18;
    const rInner = hubR + R * 0.12;
    const rOuter = R * 0.90;
    const pad = clamp(R * 0.03, 8, 16);

    const rMid = R * LABEL_RADIAL_CENTER;
    const maxRadial = Math.max(10, (rOuter - rInner) - 2 * pad);

    // fuente base
    let fs = clamp(R * 0.060, MIN_FONT_PX, 18);

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(midAngle);

    // colocamos el texto en el centro del contenedor (rMid)
    ctx.translate(rMid, 0);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // estilo
    ctx.fillStyle = c.text;
    ctx.shadowColor = "rgba(0,0,0,.22)";
    ctx.shadowBlur = c.text === "#ffffff" ? 10 : 0;

    // shrink + ellipsis
    while (fs > MIN_FONT_PX){
      ctx.font = `800 ${fs}px system-ui, -apple-system, Segoe UI, sans-serif`;
      if (ctx.measureText(text).width <= maxRadial) break;
      fs -= 1;
    }
    ctx.font = `800 ${fs}px system-ui, -apple-system, Segoe UI, sans-serif`;

    text = ellipsizeToFit(text, maxRadial);

    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function clipSegment(a0, a1){
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, a0, a1);
    ctx.closePath();
    ctx.clip();
  }

  function drawWheel(){
    if (!options.length) return;
    seg = TAU / options.length;

    for (let i = 0; i < options.length; i++){
      const a0 = i * seg + rot;
      const a1 = a0 + seg;

      // relleno segmento
      ctx.save();
      clipSegment(a0, a1);

      const cc = colors[i];
      const rg = ctx.createRadialGradient(CX, CY, R * 0.08, CX, CY, R);
      rg.addColorStop(0, rgbToCss(cc.center));
      rg.addColorStop(1, rgbToCss(cc.outer));
      ctx.fillStyle = rg;
      ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

      // label (también dentro del clip => jamás se sale)
      const mid = (a0 + a1) / 2;
      drawRadialLabel(i, mid);

      ctx.restore();

      // separador
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.arc(CX, CY, R, a0, a1);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // borde del ganador
    if (highlightIndex !== null){
      const a0 = highlightIndex * seg + rot;
      const a1 = a0 + seg;
      const pad = seg * 0.02;

      ctx.save();
      ctx.lineWidth = 6;
      ctx.shadowColor = "rgba(255,255,255,.38)";
      ctx.shadowBlur = 18;

      const lg = ctx.createLinearGradient(CX + R, CY, CX + R - 120, CY);
      lg.addColorStop(0, "rgba(255,255,255,.92)");
      lg.addColorStop(1, "rgba(255,255,255,.25)");
      ctx.strokeStyle = lg;

      ctx.beginPath();
      ctx.arc(CX, CY, R - 3, a0 + pad, a1 - pad);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHub(){
    const hubR = R * 0.18;

    const g = ctx.createLinearGradient(CX - hubR, CY - hubR, CX + hubR, CY + hubR);
    g.addColorStop(0, "#2b160b");
    g.addColorStop(0.45, "#5a361f");
    g.addColorStop(0.75, "#7a4a2a");
    g.addColorStop(1, "#2b160b");

    ctx.save();
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(CX, CY, hubR, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,.14)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  function spawnFinishSparks(){
    sparks = [];
    const n = 38;
    for (let i = 0; i < n; i++){
      const a = rand(-0.55, 0.55);
      const rr = R * rand(0.78, 0.98);
      sparks.push({
        x: CX + Math.cos(a) * rr,
        y: CY + Math.sin(a) * rr,
        vx: rand(-140, 210),
        vy: rand(-160, 160),
        life: rand(0.55, 1.05),
        r: rand(1.6, 3.6),
      });
    }
  }

  function updateFinishFx(dt){
    if (finishFx > 1) return;

    for (let i = sparks.length - 1; i >= 0; i--){
      const s = sparks[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= Math.pow(0.18, dt);
      s.vy *= Math.pow(0.18, dt);
      if (s.life <= 0) sparks.splice(i, 1);
    }

    finishFx = clamp(finishFx + dt, 0, 2);

    ctx.save();
    const a = clamp(1 - finishFx * 0.75, 0, 1);
    ctx.globalAlpha = 0.90 * a;

    for (const s of sparks){
      const grad = ctx.createLinearGradient(s.x - s.r, s.y - s.r, s.x + s.r, s.y + s.r);
      grad.addColorStop(0, "rgba(255,255,255,.95)");
      grad.addColorStop(1, "rgba(255,255,255,.12)");
      ctx.fillStyle = grad;
      ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }

    ctx.globalAlpha = 0.22 * a;
    ctx.strokeStyle = "rgba(255,255,255,.92)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(CX, CY, R - 4, -0.28, 0.28);
    ctx.stroke();

    ctx.restore();
  }

  function draw(dt){
    ctx.clearRect(0, 0, W, H);
    if (!options.length) return;

    drawWheel();
    drawHub();
    updateFinishFx(dt);
  }

  function finishSelection(){
    highlightIndex = winnerIndex;

    wrap.classList.add("rt-finish");
    pointer.classList.add("rt-flash");

    spawnFinishSparks();
    finishFx = 0;

    setTimeout(() => wrap.classList.remove("rt-finish"), 980);
    setTimeout(() => pointer.classList.remove("rt-flash"), 860);
  }

  function startSpin(){
    if (state !== "idle" || options.length < 1) return;

    highlightIndex = null;
    finishFx = 2;
    sparks = [];
    wrap.classList.remove("rt-finish");
    pointer.classList.remove("rt-flash");

    winnerIndex = pickWinner();
    fakeout = Math.random() < FAKEOUT_PROB;

    seg = TAU / options.length;

    // offsets seguros: no caer en divisiones
    const winOff = rand(seg * 0.10, seg * 0.90);

    // fakeout: casi cae en la anterior, cerca del borde hacia el ganador
    const teaseIndex = (winnerIndex - 1 + options.length) % options.length;
    const teaseOff = rand(seg * 0.82, seg * 0.92);

    const rotWinMod = mod(-(winnerIndex * seg + winOff), TAU);
    const rotTeaseMod = mod(-(teaseIndex * seg + teaseOff), TAU);

    rotStart = rot;

    const spins = 8 + Math.floor(Math.random() * 4); // 8..11

    rotWinAbs = buildAbsTarget(rotStart, rotWinMod, spins);

    if (fakeout){
      rotTeaseAbs = buildAbsTarget(rotStart, rotTeaseMod, spins);
      if (rotTeaseAbs > rotWinAbs) rotTeaseAbs -= TAU;

      // asegurar que el “nudgeo” sea pequeño (a contigua)
      if ((rotWinAbs - rotTeaseAbs) > seg * 0.60) rotWinAbs += TAU;
    } else {
      rotTeaseAbs = rotWinAbs;
    }

    startAt = performance.now();
    state = "main";
  }

  function tick(now){
    const dt = tick._last ? clamp((now - tick._last) / 1000, 0, 0.05) : 0;
    tick._last = now;

    if (state === "main"){
      const t = clamp((now - startAt) / MAIN_MS, 0, 1);

      if (!fakeout){
        const p = smoothSpinProgress(t);
        rot = rotStart + (rotWinAbs - rotStart) * p;

        if (t >= 1){
          state = "settle";
          startAt = now;
        }
      } else {
        const cut = 0.93;

        if (t <= cut){
          const p = smoothSpinProgress(t / cut);
          rot = rotStart + (rotTeaseAbs - rotStart) * p;
        } else {
          // nudgeo corto al ganador (contiguo)
          const x = (t - cut) / (1 - cut);
          const p = smoothStep(x);
          rot = rotTeaseAbs + (rotWinAbs - rotTeaseAbs) * p;

          if (t >= 1){
            state = "settle";
            startAt = now;
          }
        }
      }
    } else if (state === "settle"){
      const t = clamp((now - startAt) / SETTLE_MS, 0, 1);

      const amp = clamp(seg * 0.12, 0.03, 0.16);
      const wob = amp * Math.sin(12 * t) * Math.exp(-7 * t);

      rot = rotWinAbs + wob;

      if (t >= 1){
        rot = rotWinAbs;
        state = "idle";
        finishSelection();
      }
    }

    draw(dt);
    requestAnimationFrame(tick);
  }

  function normalizeOptions(data){
    if (Array.isArray(data)){
      return data
        .map(v => (typeof v === "string" ? v : (v?.texto ?? v?.text ?? "")))
        .filter(Boolean);
    }
    if (Array.isArray(data?.opciones)){
      return data.opciones
        .map(v => (typeof v === "string" ? v : (v?.texto ?? v?.text ?? "")))
        .filter(Boolean);
    }
    return [];
  }

  async function loadOptions(){
    try{
      const res = await fetch("./opciones.json", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar opciones.json");
      const data = await res.json();

      options = normalizeOptions(data);
      if (!options.length) options = ["Agrega citas en opciones.json"];
    } catch {
      options = ["No se pudo cargar ./ruleta/opciones.json"];
    }

    colors = generateColors(options.length);
    seg = TAU / options.length;
    resize();
  }

  // Input: click/tap/space
  wrap.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    startSpin();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space"){
      e.preventDefault();
      startSpin();
    }
  });

  window.addEventListener("resize", resize);

  loadOptions();
  resize();
  requestAnimationFrame(tick);
})();