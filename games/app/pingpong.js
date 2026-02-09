const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");
const backBtn = document.getElementById("backBtn");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

// Paletas
const paddleW = 140;
const paddleH = 14;
const paddleMargin = 40; // Distancia igualada en ambos lados

// Inicializar posiciones centradas
let pTop = { x: (canvas.width - paddleW) / 2, y: paddleMargin, score: 0 };
let pBot = { x: (canvas.width - paddleW) / 2, y: 0, score: 0 };

// Bola
let ball = {
  x: 0, y: 0, r: 8,
  vx: 0, vy: 0,
  speed: 7,
  waiting: true,
  serve: 1
};

let speedMultiplier = 1;
let pointFlash = 0;

function resetBall() {
  ball.waiting = true;
  ball.vx = 0;
  ball.vy = 0;
  speedMultiplier = 1;
  ball.serve = ball.serve === 1 ? 2 : 1;
  ball.x = canvas.width / 2;
  // La bola aparece frente a la raqueta que sirve
  ball.y = ball.serve === 1 ? canvas.height - (paddleMargin + 40) : (paddleMargin + 40);
  backBtn.style.display = "block";
}

function launchBall(x, y) {
  if (!ball.waiting) return;
  let dx = x - ball.x;
  let dy = y - ball.y;
  let len = Math.hypot(dx, dy);
  ball.vx = (dx / len) * ball.speed;
  ball.vy = (dy / len) * ball.speed;
  ball.waiting = false;
  backBtn.style.display = "none";
}

resetBall();
backBtn.onclick = () => history.back();

// LIMITAR PALETAS (No salen de pantalla)
function movePaddles(x, player) {
  let targetX = x - paddleW / 2;
  // Restricción de bordes
  if (targetX < 10) targetX = 10;
  if (targetX > canvas.width - paddleW - 10) targetX = canvas.width - paddleW - 10;
  
  if (player === "top") pTop.x = targetX;
  else pBot.x = targetX;
}

// CONTROLES
canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  if (ball.waiting) launchBall(t.clientX, t.clientY);
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  if (t.clientY < canvas.height / 2) movePaddles(t.clientX, "top");
  else movePaddles(t.clientX, "bot");
  e.preventDefault();
}, { passive: false });

// Mouse y Teclado (con límites)
canvas.addEventListener("mousedown", e => launchBall(e.clientX, e.clientY));
addEventListener("keydown", e => {
  const step = 50;
  if (e.key === "a") movePaddles(pBot.x + paddleW/2 - step, "bot");
  if (e.key === "d") movePaddles(pBot.x + paddleW/2 + step, "bot");
  if (e.key === "ArrowLeft") movePaddles(pTop.x + paddleW/2 - step, "top");
  if (e.key === "ArrowRight") movePaddles(pTop.x + paddleW/2 + step, "top");
});

function point(player) {
  if (player === 1) pBot.score++;
  else pTop.score++;
  if (navigator.vibrate) navigator.vibrate(100);
  pointFlash = 1;
  resetBall();
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!ball.waiting) {
    ball.x += ball.vx * speedMultiplier;
    ball.y += ball.vy * speedMultiplier;
    speedMultiplier += 0.0005;
  }

  // Paredes laterales
  if (ball.x < ball.r + 10 || ball.x > canvas.width - ball.r - 10) {
    ball.vx *= -1;
    ball.x = ball.x < canvas.width / 2 ? ball.r + 11 : canvas.width - ball.r - 11;
  }

  // Colisión Arriba (Ajustada visualmente)
  if (
    ball.y - ball.r <= pTop.y + paddleH &&
    ball.y - ball.r >= pTop.y &&
    ball.x > pTop.x &&
    ball.x < pTop.x + paddleW &&
    ball.vy < 0
  ) {
    ball.vy *= -1;
    ball.y = pTop.y + paddleH + ball.r; // Evita que se pegue
  }

  // Colisión Abajo (Ajustada visualmente)
  pBot.y = canvas.height - paddleMargin - paddleH; 
  if (
    ball.y + ball.r >= pBot.y &&
    ball.y + ball.r <= pBot.y + paddleH &&
    ball.x > pBot.x &&
    ball.x < pBot.x + paddleW &&
    ball.vy > 0
  ) {
    ball.vy *= -1;
    ball.y = pBot.y - ball.r;
  }

  // Goles (Línea de fondo)
  if (ball.y < 0) point(1);
  if (ball.y > canvas.height) point(2);

  draw();
  requestAnimationFrame(update);
}

function draw() {
  // 1. Fondo y Líneas
  let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#0a3a66");
  grad.addColorStop(1, "#021d33");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // 2. Marcadores (En el fondo, color grisáceo)
  ctx.fillStyle = "rgba(221, 221, 221, 0.2)"; // Gris con transparencia para efecto z-index
  ctx.font = "bold 120px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pTop.score, canvas.width / 2, canvas.height / 4);
  ctx.fillText(pBot.score, canvas.width / 2, (canvas.height / 4) * 3);

  // Red central
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.moveTo(10, canvas.height / 2);
  ctx.lineTo(canvas.width - 10, canvas.height / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Paletas
  ctx.fillStyle = "#ddd";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.fillRect(pTop.x, pTop.y, paddleW, paddleH);
  ctx.fillRect(pBot.x, pBot.y, paddleW, paddleH);
  ctx.shadowBlur = 0;

  // 4. Bola (Blanca)
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  // 5. Animación punto
  if (pointFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${pointFlash})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pointFlash -= 0.04;
  }
}

update();