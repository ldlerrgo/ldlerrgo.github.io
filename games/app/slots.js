/* ===== SLOTS ===== */
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