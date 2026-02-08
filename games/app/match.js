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