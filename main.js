/* ===== CORAZONES INICIO ===== */


const hearts=document.querySelector(".hearts");
setInterval(()=>{
  const h=document.createElement("div");
  h.className="heart";
  h.style.left=Math.random()*100+"%";
  h.style.fontSize=14+Math.random()*18+"px";
  h.textContent=["💖","✨","🌟","💘"][Math.floor(Math.random()*4)];
  hearts.appendChild(h);
  setTimeout(()=>h.remove(),8000);
},900);

document.querySelectorAll(".toy").forEach(t=>{
  t.onclick=()=>{
    t.classList.add("pop");
    setTimeout(()=>t.classList.remove("pop"),500);
  };
});



// ===== MESIVERSARIO / ANIVERSARIO =====

const startDate = new Date(2026, 0, 2); // 2 enero 2026
const today = new Date();

const title = document.getElementById("mainTitle");
const subtitle = document.getElementById("subTitle");

function diffMonths(d1, d2){
  let months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months += d2.getMonth() - d1.getMonth();
  if(d2.getDate() < d1.getDate()) months--;
  return Math.max(0, months);
}

if(title && subtitle){
  const monthsTogether = diffMonths(startDate, today);
  const isDay2 = today.getDate() === 2;
  const isJan2 = today.getDate() === 2 && today.getMonth() === 0;

  if(isDay2){
    if(isJan2){
      title.textContent = "💖¡FELIZ ANIVERSARIO!💖";
    }else{
      title.textContent = "💖¡FELIZ MESIVERSARIO!💖";
    }

    if(monthsTogether == 1){
      subtitle.textContent = `Gracias por este primer mes juntos 💙`;
    }else{
      subtitle.textContent = `Gracias por estos ${monthsTogether} meses juntos 💙`;
    }
    title.style.cursor = "pointer";
    title.onclick = startConfetti;
  }else{
    subtitle.textContent = "Elige una opción";
  }
}


// ===== CONFETI =====

const canvas = document.getElementById("confetti");
let ctx, pieces = [], confettiActive = false;

if(canvas){
  ctx = canvas.getContext("2d");

  function resizeConfetti(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeConfetti();
  window.addEventListener("resize", resizeConfetti);
}

function startConfetti(){
  if(!canvas || !ctx) return;

  pieces = [];
  for(let i=0;i<180;i++){
    pieces.push({
      x: Math.random()*canvas.width,
      y: -Math.random()*canvas.height,
      w: 6+Math.random()*6,
      h: 10+Math.random()*10,
      vy: 2+Math.random()*3,
      vx: -1+Math.random()*2,
      rot: Math.random()*360,
      vr: -4+Math.random()*8,
      hue: Math.random()*360,
      life: 0
    });
  }
  confettiActive = true;
  drawConfetti();
}

function drawConfetti(){
  if(!confettiActive) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  pieces.forEach(p=>{
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot * Math.PI/180);
    ctx.fillStyle = `hsl(${p.hue},80%,60%)`;
    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    ctx.restore();

    p.y += p.vy;
    p.x += p.vx + Math.sin(p.life/20)*0.8;
    p.rot += p.vr;
    p.life++;
  });

  pieces = pieces.filter(p => p.y < canvas.height + 40);
  if(pieces.length === 0) confettiActive = false;

  requestAnimationFrame(drawConfetti);
}