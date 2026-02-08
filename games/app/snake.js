/* ===== SNAKE ===== */

let snake, food, dir, snakeTimer, gridSize=16, cell=20;
let snakeImgs=[];

async function initSnake(){
  snakeImgs = await getImages();
  const canvas = document.getElementById("snakeCanvas");
  const ctx = canvas.getContext("2d");

  snake = [{x:8,y:8}];
  dir = {x:1,y:0};
  spawnFood();
  updatePreview();

  clearInterval(snakeTimer);
  snakeTimer = setInterval(()=>gameLoop(ctx),160);
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

function gameLoop(ctx){
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
    blinkSnake(ctx);
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

  drawSnake(ctx);
}

function drawSnake(ctx){
  ctx.clearRect(0,0,320,320);

  // comida
  ctx.fillStyle="#ff4fd8";
  ctx.beginPath();
  ctx.arc(food.x*cell+10, food.y*cell+10, 6, 0, Math.PI*2);
  ctx.fill();

  // serpiente
  ctx.fillStyle="#60a5fa";
  snake.forEach((s,i)=>{
    ctx.fillRect(s.x*cell, s.y*cell, cell-2, cell-2);
  });
}

function updatePreview(flash=false){
  const box = document.getElementById("snakePreview");
  const img = rand(snakeImgs);
  box.innerHTML = `<img src="../img/${img}">`;

  if(flash){
    box.classList.add("flash");
    setTimeout(()=>box.classList.remove("flash"),500);
  }
}

function blinkSnake(ctx){
  let visible = true;
  let count = 0;

  const blink = setInterval(()=>{
    visible = !visible;
    ctx.clearRect(0,0,320,320);
    if(visible) drawSnake(ctx);
    count++;

    if(count > 10){
      clearInterval(blink);
      initSnake();
    }
  },200);
}
