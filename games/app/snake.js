/* ===== SNAKE ===== */
if (window.location.pathname.includes('pingpong.html')) {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth <= 1024;

    if (!isTouch && !isSmallScreen) {
        alert("Este juego solo está disponible en dispositivos móviles 📱");
        window.location.href = "../index.html"; 
    }
}

let snake, food, dir, snakeTimer;
let gridSize = 16;
let cell = 0;
let snakeImgs = [];
let snakeCanvas, snakeCtx;

async function initSnake(){
  snakeImgs = await getImages();

  snakeCanvas = document.getElementById("snakeCanvas");
  snakeCtx = snakeCanvas.getContext("2d");

  // tamaño dinámico real
  const size = snakeCanvas.getBoundingClientRect().width;
  snakeCanvas.width = size;
  snakeCanvas.height = size;
  cell = size / gridSize;

  snake = [{x:8,y:8}];
  dir = {x:1,y:0};
  spawnFood();
  updatePreview();

  clearInterval(snakeTimer);
  snakeTimer = setInterval(gameLoop,160);

  initSnakeControls();
}

function setDir(x,y){
  if(dir.x === -x && dir.y === -y) return;
  dir = {x,y};
}

function spawnFood(){
  food = {
    x: Math.floor(Math.random()*gridSize),
    y: Math.floor(Math.random()*gridSize)
  };
}

function gameLoop(){
  const head = {
    x: snake[0].x + dir.x,
    y: snake[0].y + dir.y
  };

  // colisión
  if(
    head.x<0||head.y<0||
    head.x>=gridSize||head.y>=gridSize||
    snake.some(s=>s.x===head.x && s.y===head.y)
  ){
    clearInterval(snakeTimer);
    blinkSnake();
    return;
  }

  snake.unshift(head);

  // comer
  if(head.x===food.x && head.y===food.y){
    spawnFood();
    updatePreview(true);
  }else{
    snake.pop();
  }

  drawSnake();
}

function drawSnake(){
  snakeCtx.clearRect(0,0,snakeCanvas.width,snakeCanvas.height);

  // comida
  snakeCtx.fillStyle="#ff4fd8";
  snakeCtx.beginPath();
  snakeCtx.arc(
    food.x*cell + cell/2,
    food.y*cell + cell/2,
    cell*0.3,
    0, Math.PI*2
  );
  snakeCtx.fill();

  // serpiente
  snakeCtx.fillStyle="#60a5fa";
  snake.forEach(s=>{
    snakeCtx.fillRect(
      s.x*cell,
      s.y*cell,
      cell-2,
      cell-2
    );
  });
}

function updatePreview(flash=false){
  const box = document.getElementById("snakePreview");
  if(!box || snakeImgs.length===0) return;

  const img = rand(snakeImgs);
  box.innerHTML = `<img src="../img/${img}">`;

  if(flash){
    box.classList.add("flash");
    setTimeout(()=>box.classList.remove("flash"),500);
  }
}

function blinkSnake(){
  let visible = true;
  let count = 0;

  const blink = setInterval(()=>{
    visible = !visible;
    snakeCtx.clearRect(0,0,snakeCanvas.width,snakeCanvas.height);
    if(visible) drawSnake();
    count++;

    if(count > 10){
      clearInterval(blink);
      initSnake();
    }
  },200);
}

/* ===== CONTROLES ===== */

function initSnakeControls(){

  // teclado
  document.addEventListener("keydown", e=>{
    if(e.key==="ArrowUp") setDir(0,-1);
    if(e.key==="ArrowDown") setDir(0,1);
    if(e.key==="ArrowLeft") setDir(-1,0);
    if(e.key==="ArrowRight") setDir(1,0);
  });

  // swipe
  let touchStartX=0, touchStartY=0;

  snakeCanvas.addEventListener("touchstart", e=>{
    e.preventDefault();
    const t=e.touches[0];
    touchStartX=t.clientX;
    touchStartY=t.clientY;
  },{passive:false});

  snakeCanvas.addEventListener("touchmove", e=>{
    e.preventDefault();
  },{passive:false});

  snakeCanvas.addEventListener("touchend", e=>{
    const t=e.changedTouches[0];
    const dx=t.clientX-touchStartX;
    const dy=t.clientY-touchStartY;

    if(Math.abs(dx)>Math.abs(dy)){
      if(dx>0) setDir(1,0);
      else setDir(-1,0);
    }else{
      if(dy>0) setDir(0,1);
      else setDir(0,-1);
    }
  },{passive:false});
}

