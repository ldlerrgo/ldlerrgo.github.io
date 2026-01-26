async function getImages(){
  const res = await fetch("../img/list.json");
  return await res.json();
}
const rand = arr => arr[Math.floor(Math.random()*arr.length)];

/* ===== MATCH ===== */
async function initMatch(level="normal"){
  const levels={facil:3,normal:4,dificil:5};
  const size=levels[level];
  const total=size*size,pairs=total/2;

  const imgs=await getImages();
  const pick=imgs.sort(()=>Math.random()-0.5).slice(0,pairs);
  const cards=[...pick,...pick].sort(()=>Math.random()-0.5);

  const grid=document.getElementById("match");
  grid.innerHTML="";
  grid.style.gridTemplateColumns=`repeat(${size},1fr)`;

  let first=null,lock=false,matched=0;

  cards.forEach(src=>{
    const c=document.createElement("div");
    c.className="card";

    const inner=document.createElement("div");
    inner.className="card-inner";

    const back=document.createElement("div");
    back.className="card-face card-back";

    const front=document.createElement("div");
    front.className="card-face card-front";

    const img=document.createElement("img");
    img.src="../img/"+src;
    front.appendChild(img);

    inner.appendChild(back);
    inner.appendChild(front);
    c.appendChild(inner);

    c.onclick=()=>{
      if(lock||c.classList.contains("flipped"))return;
      c.classList.add("flipped");

      if(!first){first=c;}
      else{
        lock=true;
        if(first.querySelector("img").src===img.src){
          setTimeout(()=>{
            first.style.visibility="hidden";
            c.style.visibility="hidden";
            matched+=2;
            if(matched===cards.length)setTimeout(()=>initMatch(level),800);
            first=null;lock=false;
          },400);
        }else{
          setTimeout(()=>{
            first.classList.remove("flipped");
            c.classList.remove("flipped");
            first=null;lock=false;
          },700);
        }
      }
    };
    grid.appendChild(c);
  });
}

/* ===== PUZZLE ===== */
let puzzleSize=4,puzzleTiles=[];
function isAdj(i,j,s){
  const r=Math.floor(i/s),c=i%s;
  const r2=Math.floor(j/s),c2=j%s;
  return Math.abs(r-r2)+Math.abs(c-c2)===1;
}

async function initPuzzle(){
  const map={3:3,4:4,5:5};
  puzzleSize=map[parseInt(document.getElementById("level").value)];
  const imgs=await getImages();
  const img="../img/"+rand(imgs);

  const puzzle=document.getElementById("puzzle");
  puzzle.innerHTML="";
  puzzle.style.gridTemplateColumns=`repeat(${puzzleSize},1fr)`;

  const order=[...Array(puzzleSize*puzzleSize).keys()].sort(()=>Math.random()-0.5);
  puzzleTiles=[];
  order.forEach(v=>{
    const t=document.createElement("div");
    t.className="tile";
    t.dataset.val=v;
    if(v===order.length-1)t.classList.add("empty");
    else{
      t.style.backgroundImage=`url(${img})`;
      t.style.backgroundSize=`${puzzleSize*100}% ${puzzleSize*100}%`;
      t.style.backgroundPosition=
        `${(v%puzzleSize)*(100/(puzzleSize-1))}% ${(Math.floor(v/puzzleSize))*(100/(puzzleSize-1))}%`;
    }
    t.onclick=()=>moveTile(t);
    puzzle.appendChild(t);
    puzzleTiles.push(t);
  });
}

function moveTile(tile){
  const puzzle=document.getElementById("puzzle");
  const i=puzzleTiles.indexOf(tile);
  const ei=puzzleTiles.findIndex(t=>t.classList.contains("empty"));
  if(!isAdj(i,ei,puzzleSize))return;

  const dx=(ei%puzzleSize)-(i%puzzleSize);
  const dy=Math.floor(ei/puzzleSize)-Math.floor(i/puzzleSize);
  tile.style.transform=`translate(${dx*100}%,${dy*100}%)`;

  setTimeout(()=>{
    tile.style.transform="";
    [puzzleTiles[i],puzzleTiles[ei]]=[puzzleTiles[ei],puzzleTiles[i]];
    puzzle.innerHTML="";
    puzzleTiles.forEach(t=>puzzle.appendChild(t));
    if(puzzleTiles.every((t,i)=>t.dataset.val==i))
      alert(rand(["Ganaste","Perfecto","Lo lograste"]));
  },260);
}

/* ===== SLOTS (con limite diario real) ===== */
let slotImgs=[];
const MAX_SPINS=20;
const JACKPOT_PROB=0.02;

function getSlotData(){
  const d=JSON.parse(localStorage.getItem("slotData")||"{}");
  const today=new Date().toDateString();
  if(d.date!==today) return {date:today,spins:0};
  return d;
}
function saveSlotData(d){
  localStorage.setItem("slotData",JSON.stringify(d));
}
function timeToMidnight(){
  const n=new Date(), m=new Date();
  m.setHours(24,0,0,0);
  const diff=m-n;
  const h=Math.floor(diff/3600000);
  const min=Math.floor(diff%3600000/60000);
  const s=Math.floor(diff%60000/1000);
  return `${h}:${min.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

async function initSlots(){
  slotImgs=await getImages();
  const box=document.getElementById("slots");
  box.innerHTML="";
  for(let i=0;i<3;i++){
    const d=document.createElement("div");
    d.className="slot";
    box.appendChild(d);
  }
  updateSpinUI();
}

function updateSpinUI(){
  const data=getSlotData();
  const btn=document.querySelector("button");
  const msg=document.getElementById("slotMsg");

  if(data.spins>=MAX_SPINS){
    btn.disabled=true;
    const tick=()=>{
      msg.textContent=`Vuelve a intentarlo en ${timeToMidnight()}`;
    };
    tick(); setInterval(tick,1000);
  }else{
    btn.disabled=false;
    msg.textContent=`Intentos: ${MAX_SPINS-data.spins}/${MAX_SPINS}`;
  }
}

function pickSlotsWithFixedJackpot(prob=JACKPOT_PROB){
  if(!slotImgs || slotImgs.length===0) return [null,null,null];

  const win=Math.random() < prob;

  if(win){
    const img=rand(slotImgs);
    return [img,img,img];
  }

  if(slotImgs.length===1){
    const img=slotImgs[0];
    return [img,img,img];
  }

  let a,b,c;
  do{
    a=rand(slotImgs);
    b=rand(slotImgs);
    c=rand(slotImgs);
  }while(a===b && b===c);

  return [a,b,c];
}

function spin(){
  const data=getSlotData();
  if(data.spins>=MAX_SPINS)return;

  data.spins++; saveSlotData(data);
  updateSpinUI();

  const btn=document.querySelector("button");
  const cards=document.querySelectorAll("#slots .slot");
  const msg=document.getElementById("slotMsg");

  btn.disabled=true;
  cards.forEach(c=>c.classList.remove("win"));

  const picks=pickSlotsWithFixedJackpot();

  cards.forEach((c,i)=>{
    let elapsed=0;
    const stop=900+i*700;
    const timer=setInterval(()=>{
      c.innerHTML=`<img src="../img/${rand(slotImgs)}">`;
      elapsed+=120;
      if(elapsed>=stop){
        clearInterval(timer);
        c.innerHTML=`<img src="../img/${picks[i]}">`;
        c.classList.add("win");
        if(i===2){
          btn.disabled=false;

          if(picks[0]===picks[1]&&picks[1]===picks[2])
            msg.textContent=rand(["JACKPOT","PERFECTO"]);
          else if(picks[0]===picks[1]||picks[1]===picks[2]||picks[0]===picks[2])
            msg.textContent=rand(["Uyyyy casi","Eso estuvo cerca"]);

          setTimeout(updateSpinUI,1200);
        }
      }
    },120);
  });
}
